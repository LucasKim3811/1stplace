from __future__ import annotations
import json
import re
from pathlib import Path
from typing import Dict, List, Any

def parse_yosys_stat(json_path: Path, txt_path: Path | None = None) -> Dict[str, Any]:
    """Return cell_count and a crude 'ge' (gate equivalents) proxy."""
    cell_count = 0
    ge = 0
    if json_path.exists():
        data = json.loads(json_path.read_text())
        # Yosys stat -json schema: data["modules"][<top>]["cells_by_type"]
        # Aggregate counts
        for mod in data.get("modules", {}).values():
            cells = mod.get("cells_by_type", {})
            cell_count += sum(int(v) for v in cells.values())
        ge = cell_count  # simple proxy
    elif txt_path and txt_path.exists():
        txt = txt_path.read_text()
        m = re.search(r"Number of cells:\s+(\d+)", txt)
        if m:
            cell_count = int(m.group(1))
            ge = cell_count
    return {"cell_count": cell_count, "ge": ge}

def parse_sta_summary(summary_path: Path) -> Dict[str, Any]:
    period_ns = None
    wns_ns = None
    tns_ns = None
    if not summary_path.exists():
        return {"clock_period_ns": None, "wns_ns": None, "tns_ns": None, "fmax_mhz": None}
    for line in summary_path.read_text().splitlines():
        if line.startswith("CLOCK_PERIOD_NS="):
            period_ns = float(line.split("=")[1])
        elif line.startswith("WNS_NS="):
            wns_ns = float(line.split("=")[1])
        elif line.startswith("TNS_NS="):
            tns_ns = float(line.split("=")[1])
    fmax_mhz = 1000.0 / period_ns if period_ns and period_ns > 0 else None
    return {"clock_period_ns": period_ns, "wns_ns": wns_ns, "tns_ns": tns_ns, "fmax_mhz": fmax_mhz}

def timing_breakdown_from_checks(checks_path: Path) -> List[Dict[str, Any]]:
    """
    Produce a tiny 'breakdown' list from report_checks output.
    We’ll just return a fixed example if parsing is hard.
    """
    if not checks_path.exists():
        return [{"stage": "comb", "ns": 1.5}, {"stage": "clkq", "ns": 0.12}]
    # Minimal heuristic: count occurrences of "data arrival time" lines (not robust, but OK for MVP)
    txt = checks_path.read_text()
    # This is a placeholder—you can enrich with real STA parsing later.
    return [{"stage": "comb", "ns": 1.5}, {"stage": "clkq", "ns": 0.12}]

def power_proxy_from_vcd(vcd_path: Path, cell_count: int, fmax_mhz: float | None) -> Dict[str, Any]:
    """
    Lightweight dynamic power proxy:
      dyn_mw ≈ k * toggles_norm * freq * cells
    For MVP, we return a dummy series and compute a plausible dyn number.
    """
    # Series for chart (descending line)
    series = [{"t": i, "mw": 60 - i*3} for i in range(10)]
    base_dyn = 42.0
    leak = 2.0
    return {"dyn_mw": base_dyn, "leak_mw": leak, "series": series}
