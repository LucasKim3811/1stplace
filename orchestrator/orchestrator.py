#!/usr/bin/env python3
"""
VeriRL Optimizer — Orchestrator (hackathon MVP)

- Async closed-loop controller:
  Planner -> Programmer -> Reviewer -> (Yosys/OpenSTA/Verilator) -> Evaluator
- Uses OpenAI-compatible chat API (works with vLLM / HF TGI OpenAI router).
- Safe fallbacks when EDA tools aren't installed; replace with your real paths.
- No DB/S3 here to keep the file self-contained; return dicts you can insert.

Env (typical):
  LLM_BASE_URL=http://localhost:8000/v1     # OpenAI-compatible endpoint
  LLM_API_KEY=sk-...
  PLANNER_MODEL=mistralai/Mistral-7B-Instruct-v0.3
  PROGRAMMER_MODEL=deepseek-ai/deepseek-coder-6.7b-instruct
  REVIEWER_MODEL=mistralai/Mistral-7B-Instruct-v0.3
  EVALUATOR_MODEL=mistralai/Mistral-7B-Instruct-v0.3

CLI:
  python orchestrator.py               # runs a tiny demo on an adder RTL
"""

from __future__ import annotations
import os, json, asyncio, shutil, subprocess, tempfile, textwrap, difflib
from dataclasses import dataclass, asdict
from typing import Any, Dict, Optional, List, Tuple

import httpx

# --------- Models (env-configurable) ----------
PLANNER_MODEL    = os.getenv("PLANNER_MODEL",   "mistralai/Mistral-7B-Instruct-v0.3")
PROGRAMMER_MODEL = os.getenv("PROGRAMMER_MODEL","deepseek-ai/deepseek-coder-6.7b-instruct")
REVIEWER_MODEL   = os.getenv("REVIEWER_MODEL",  "mistralai/Mistral-7B-Instruct-v0.3")
EVALUATOR_MODEL  = os.getenv("EVALUATOR_MODEL", "mistralai/Mistral-7B-Instruct-v0.3")

LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://localhost:8000/v1")
LLM_API_KEY  = os.getenv("LLM_API_KEY", "no-key")

DEFAULT_MAX_ITERS = int(os.getenv("MAX_ITERS", "10"))

# --------- Simple PPA target & metrics ----------
@dataclass
class Targets:
    """User targets (keep it simple for MVP)."""
    max_area: Optional[float] = None           # gate count or normalized area
    min_fmax_mhz: Optional[float] = None       # MHz
    max_power_mw: Optional[float] = None       # mW

@dataclass
class JobSpec:
    job_id: str
    rtl_top: str
    rtl_text: str
    targets: Targets
    max_iters: int = DEFAULT_MAX_ITERS
    budget_s: Optional[int] = None  # not enforced here, but available

@dataclass
class PPAMetrics:
    area_eq_gates: Optional[float]
    fmax_mhz: Optional[float]
    power_mw: Optional[float]
    wns_ns: Optional[float]
    notes: str = ""

@dataclass
class IterationRecord:
    iter_idx: int
    plan: str
    candidate_rtl: str
    reviewer_ok: bool
    metrics: PPAMetrics
    score: float
    done: bool
    diff_unified: str

# --------- OpenAI-compatible client ----------
class ChatClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self._client = httpx.AsyncClient(timeout=120)

    async def chat(self, model: str, system: str, user: str) -> str:
        """
        Calls POST /chat/completions (OpenAI compatible).
        """
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.2,
            "max_tokens": 1024,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        url = f"{self.base_url}/chat/completions"
        r = await self._client.post(url, json=payload, headers=headers)
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"]

    async def aclose(self):
        await self._client.aclose()

# --------- Agents ----------
class Planner:
    def __init__(self, llm: ChatClient):
        self.llm = llm

    async def propose(self, job: JobSpec, last_notes: str = "") -> str:
        sys = "You are a senior RTL optimization planner. Output a short numbered list of concrete edits."
        usr = f"""
Design top: {job.rtl_top}
Targets: {job.targets}
Context or last iteration notes (may be empty):
{last_notes}

Propose 1-3 precise optimization steps that are SAFE and likely to improve timing/area/power. 
Use this exact format:
PLAN:
1) <specific syntactic change>
2) <optional>
3) <optional>
"""
        out = await self.llm.chat(PLANNER_MODEL, sys, textwrap.dedent(usr))
        return out.strip()

class Programmer:
    def __init__(self, llm: ChatClient):
        self.llm = llm

    async def apply(self, rtl_text: str, plan: str, top: str) -> str:
        sys = "You are an expert Verilog engineer. Apply the plan EXACTLY. Keep module I/O identical. Return ONLY the full modified Verilog."
        usr = f"""
Top module: {top}

Original RTL:
