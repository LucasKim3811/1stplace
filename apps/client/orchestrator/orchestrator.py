#!/usr/bin/env python3
"""
VeriRL Optimizer — LLM Orchestrator (FastAPI)

Exposes role endpoints:
  POST /planner   -> {"candidates":[{"transform": "...", "params": {...}, "rationale":"..."}]}
  POST /programmer-> {"patches":[{"path":"rtl/<file>.v","unified_diff":"--- a/..."}], "synth_script_patch": "..."}
  POST /reviewer  -> {"ok": true|false, "reasons": [...], "auto_fix_suggestions":[...]}
  POST /evaluator -> {"stop": true|false, "reason":"...", "next_hints":[...], "best": {...}}
  GET  /healthz   -> {"ok": true}

Talks to any **OpenAI-compatible** /chat/completions server:
  LLM_BASE_URL, LLM_API_KEY, *_MODEL envs control behavior.

Set MOCK_ORCH=1 to return deterministic, no-LLM responses (for quick demos).
"""

from __future__ import annotations
import os, re, json, textwrap
from typing import Any, Dict, List, Optional

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, ValidationError

# ----------------- Config -----------------
PLANNER_MODEL    = os.getenv("PLANNER_MODEL",   "mistralai/Mistral-7B-Instruct-v0.3")
PROGRAMMER_MODEL = os.getenv("PROGRAMMER_MODEL","deepseek-ai/deepseek-coder-6.7b-instruct")
REVIEWER_MODEL   = os.getenv("REVIEWER_MODEL",  "mistralai/Mistral-7B-Instruct-v0.3")
EVALUATOR_MODEL  = os.getenv("EVALUATOR_MODEL", "mistralai/Mistral-7B-Instruct-v0.3")

LLM_BASE_URL     = os.getenv("LLM_BASE_URL", "http://localhost:8000/v1").rstrip("/")
LLM_API_KEY      = os.getenv("LLM_API_KEY", "no-key")
TIMEOUT_S        = int(os.getenv("ORCH_TIMEOUT_S", "120"))
MOCK_ORCH        = os.getenv("MOCK_ORCH", "0") == "1"

ALLOWED_TRANSFORMS = ["pipeline_depth","unroll_factor","fsm_encoding","abc_script","resource_sharing","clock_period_ns"]

# ----------------- Schemas -----------------
class PlannerCandidate(BaseModel):
    transform: str
    params: Dict[str, Any] = Field(default_factory=dict)
    rationale: str

class PlannerOut(BaseModel):
    candidates: List[PlannerCandidate]

class ProgrammerOut(BaseModel):
    patches: List[Dict[str, str]] = Field(default_factory=list)   # [{path, unified_diff}]
    synth_script_patch: Optional[str] = None

class ReviewerOut(BaseModel):
    ok: bool
    reasons: Optional[List[str]] = None
    auto_fix_suggestions: Optional[List[str]] = None

class EvaluatorOut(BaseModel):
    stop: bool
    reason: str
    next_hints: Optional[List[str]] = None
    best: Optional[Dict[str, Any]] = None

# ----------------- Helpers -----------------
def extract_json_block(text: str) -> str:
    """Grab first {...} JSON block (robust to extra prose)."""
    m = re.search(r"\{.*\}", text, flags=re.S)
    return m.group(0) if m else ""

async def openai_chat(model: str, system: str, user: str,
                      temperature: float, max_tokens: int) -> str:
    headers = {"Authorization": f"Bearer {LLM_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": [{"role":"system","content":system},{"role":"user","content":user}],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    async with httpx.AsyncClient(timeout=TIMEOUT_S) as client:
        r = await client.post(f"{LLM_BASE_URL}/chat/completions", headers=headers, json=payload)
        if not r.is_success:
            raise HTTPException(r.status_code, f"LLM error: {r.text[:200]}")
        data = r.json()
        return data["choices"][0]["message"]["content"]

# ----------------- Prompts -----------------
def planner_prompt(targets: Dict[str,Any], last_result: Dict[str,Any]) -> tuple[str,str]:
    sys = ("You are the Planner for an RTL PPA optimizer. "
           f"Propose 2–3 SAFE, interface-preserving candidates using only {ALLOWED_TRANSFORMS}. "
           'Return STRICT JSON only as {"candidates":[{"transform":"...","params":{...},"rationale":"..."}]}')
    usr = f"TARGETS={json.dumps(targets)}\nLAST_RESULT={json.dumps(last_result)}"
    return sys, usr

def programmer_prompt(files: Dict[str,str], candidate: Dict[str,Any]) -> tuple[str,str]:
    sys = ("You are an expert Verilog engineer. Apply the candidate exactly, without changing module I/O. "
           "Avoid latches; keep widths correct; preserve valid/ready semantics. "
           "If needed, also patch synth.ys. Output STRICT JSON only:\n"
           '{"patches":[{"path":"rtl/<file>.v","unified_diff":"--- a/...\\n+++ b/...\\n@@ ..."}],'
           '"synth_script_patch":"--- a/synth.ys\\n+++ b/synth.ys\\n@@ ..."}')
    files_preview = "\n\n".join([f"// FILE: {p}\n{src}" for p,src in files.items()])
    usr = f"CANDIDATE={json.dumps(candidate)}\nFILES:\n{files_preview}"
    return sys, usr

def reviewer_prompt(programmer_json: Dict[str,Any]) -> tuple[str,str]:
    sys = ("Validate the Programmer JSON diff. Requirements: identical port lists; no width mismatches; "
           "no inferred latches; all signals driven. Output STRICT JSON:\n"
           '{"ok":true} or {"ok":false,"reasons":["..."],"auto_fix_suggestions":["..."]}')
    usr = f"PROGRAMMER_JSON={json.dumps(programmer_json)}"
    return sys, usr

def evaluator_prompt(targets: Dict[str,Any], batch_results: List[Dict[str,Any]], current_best: Dict[str,Any]) -> tuple[str,str]:
    sys = ('Given PPA JSON results and constraints, decide stop/continue and propose next 1–2 hints. '
           'Output STRICT JSON: {"stop":true|false,"reason":"...","next_hints":["..."],"best":{...}}')
    usr = f"TARGETS={json.dumps(targets)}\nBATCH={json.dumps(batch_results)}\nCURRENT_BEST={json.dumps(current_best)}"
    return sys, usr

# ----------------- FastAPI -----------------
app = FastAPI(title="VeriRL LLM Orchestrator")

@app.get("/healthz")
async def healthz():
    return {"ok": True}

@app.post("/planner", response_model=PlannerOut)
async def planner(body: Dict[str, Any]):
    if MOCK_ORCH:
        return PlannerOut(candidates=[
            PlannerCandidate(transform="abc_script", params={"script":"resyn2"}, rationale="standard mapping"),
            PlannerCandidate(transform="pipeline_depth", params={"depth":1}, rationale="reduce comb depth"),
        ])
    sys, usr = planner_prompt(body["targets"], body["last_result"])
    text = await openai_chat(PLANNER_MODEL, sys, usr, temperature=0.2, max_tokens=600)
    js = extract_json_block(text)
    if not js:
        # retry with stricter instruction
        text = await openai_chat(PLANNER_MODEL, sys + "\nReturn ONLY JSON.", usr, 0.15, 600)
        js = extract_json_block(text)
    try:
        return PlannerOut.model_validate_json(js)
    except ValidationError as e:
        raise HTTPException(422, f"Planner invalid JSON: {e}")

@app.post("/programmer", response_model=ProgrammerOut)
async def programmer(body: Dict[str, Any]):
    if MOCK_ORCH:
        return ProgrammerOut(patches=[], synth_script_patch=None)
    sys, usr = programmer_prompt(body["files"], body["candidate"])
    text = await openai_chat(PROGRAMMER_MODEL, sys, usr, temperature=0.1, max_tokens=2200)
    js = extract_json_block(text)
    if not js:
        text = await openai_chat(PROGRAMMER_MODEL, sys + "\nOUTPUT ONLY VALID JSON PER SCHEMA.", usr, 0.1, 2200)
        js = extract_json_block(text)
    try:
        return ProgrammerOut.model_validate_json(js)
    except ValidationError as e:
        raise HTTPException(422, f"Programmer invalid JSON: {e}")

@app.post("/reviewer", response_model=ReviewerOut)
async def reviewer(body: Dict[str, Any]):
    if MOCK_ORCH:
        return ReviewerOut(ok=True)
    sys, usr = reviewer_prompt(body["programmer_json"])
    text = await openai_chat(REVIEWER_MODEL, sys, usr, temperature=0.0, max_tokens=400)
    js = extract_json_block(text)
    if not js:
        text = await openai_chat(REVIEWER_MODEL, sys + "\nReturn ONLY JSON.", usr, 0.0, 400)
        js = extract_json_block(text)
    try:
        return ReviewerOut.model_validate_json(js)
    except ValidationError as e:
        raise HTTPException(422, f"Reviewer invalid JSON: {e}")

@app.post("/evaluator", response_model=EvaluatorOut)
async def evaluator(body: Dict[str, Any]):
    if MOCK_ORCH:
        return EvaluatorOut(stop=False, reason="continue", next_hints=["abc_script"], best=body.get("current_best", {}))
    sys, usr = evaluator_prompt(body["targets"], body["batch"], body["current_best"])
    text = await openai_chat(EVALUATOR_MODEL, sys, usr, temperature=0.2, max_tokens=600)
    js = extract_json_block(text)
    if not js:
        text = await openai_chat(EVALUATOR_MODEL, sys + "\nReturn ONLY JSON.", usr, 0.2, 600)
        js = extract_json_block(text)
    try:
        return EvaluatorOut.model_validate_json(js)
    except ValidationError as e:
        raise HTTPException(422, f"Evaluator invalid JSON: {e}")
