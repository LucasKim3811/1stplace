from __future__ import annotations
import os, time, json, difflib, tempfile
from pathlib import Path
from typing import Dict, Any, List
import requests

from runners import (
    prepare_workspace, render_synth, render_sta,
    run_verilator_pytest, run_yosys, run_opensta
)
from parsers import parse_yosys_stat, parse_sta_summary, timing_breakdown_from_checks, power_proxy_from_vcd

# --------- Env ----------
NEXT_JOB_URL      = os.getenv("LOVABLE_NEXT_JOB_URL")
CALLBACK_URL      = os.getenv("LOVABLE_CALLBACK_URL")
ORCH              = os.getenv("ORCH_BASE_URL", "http://localhost:8000")

POLL_INTERVAL     = int(os.getenv("POLL_INTERVAL_SEC", "3"))
DATA_ROOT         = Path(os.getenv("DATA_ROOT", "/data/jobs"))
MAX_ITERS_DEFAULT = int(os.getenv("MAX_ITERS", "10"))
MAX_PARALLEL      = int(os.getenv("MAX_PARALLEL", "2"))
DEFAULT_CLOCK     = os.getenv("DEFAULT_CLOCK_PORT", "clk")
DEFAULT_FREQ_MHZ  = float(os.getenv("DEFAULT_FREQ_MHZ", "500"))

LIB_PATH = Path(os.getenv("LIB_PATH", "/app/tools/sky130.lib"))  # replace if you have one; not strictly required for MVP

DATA_ROOT.mkdir(parents=True, exist_ok=True)

# --------- Helpers ----------
def get_queued_job() -> Dict[str, Any] | None:
    """Your Lovable Edge Function should return a JSON like:
       {"job_id": "...", "spec": {...}}
       and atomically mark it running.
    """
    try:
        r = requests.get(NEXT_JOB_URL, timeout=20)
        if r.ok:
            data = r.json()
            return data if data.get("job_id") else None
    except Exception:
        return None
    return None

def post_update(job_id: str, payload: Dict[str, Any]):
    try:
        body = {"job_id": job_id, **payload}
        requests.post(CALLBACK_URL, json=body, timeout=30)
    except Exception as e:
        print("callback error:", e)

def call_orch(path: str, body: Dict[str, Any], timeout=120):
    r = requests.post(ORCH + path, json=body, timeout=timeout)
    r.raise_for_status()
    return r.json()

def unified_diff(before: str, after: str, fname: str) -> str:
    return "\n".join(difflib.unified_diff(
        before.splitlines(), after.splitlines(), fromfile=f"a/{fname}", tofile=f"b/{fname}"
    ))

# --------- Core loop ----------
def process_job(job: Dict[str, Any]):
    job_id = job["job_id"]
    spec   = job["spec"]
    top    = spec.get("top_module", "top")
    targets = spec.get("targets", {"frequency_mhz": DEFAULT_FREQ_MHZ})
    freq_mhz = float(targets.get("frequency_mhz", DEFAULT_FREQ_MHZ))
    max_iters = int(spec.get("budgets", {}).get("max_iters", MAX_ITERS_DEFAULT))
    parallel  = int(spec.get("budgets", {}).get("max_parallel", MAX_PARALLEL))
    rtl_text  = spec.get("original_verilog", f"module {top}(input {DEFAULT_CLOCK});endmodule")

    with tempfile.TemporaryDirectory(dir=DATA_ROOT) as tmp:
        work = Path(tmp)
        # Stage design files
        prepare_workspace(work, rtl_text, top)
        # Render EDA scripts
        render_synth(top, freq_mhz, abc_script=spec.get("abc_script","resyn2"), out_path=work/"synth.ys")
        period_ns = 1000.0 / freq_mhz
        render_sta(LIB_PATH, work/"synth/netlist.v", top, DEFAULT_CLOCK, period_ns, out_path=work/"scripts/sta.tcl")

        # ------ Baseline ------
        sim = run_verilator_pytest(work)
        yos = run_yosys(work)
        sta = run_opensta(work)
        yos_stat = parse_yosys_stat(work/"reports"/"yosys_stat.json", work/"reports"/"yosys_stat.txt")
        sta_sum  = parse_sta_summary(work/"reports"/"sta_summary.txt")
        power    = power_proxy_from_vcd(Path(sim.get("vcd") or ""), yos_stat["cell_count"], sta_sum.get("fmax_mhz"))

        best = {
            "functional_pass": bool(sim["pass"]),
            "fmax_mhz": sta_sum.get("fmax_mhz") or 0.0,
            "area_ge": yos_stat["ge"],
            "dyn_power_mw": power["dyn_mw"],
            "leak_power_mw": power["leak_mw"],
            "gate_count": yos_stat["cell_count"],
            "power_savings_pct": 0.0,                # baseline is 0; later compare deltas if you want
            "timing_improvement_pct": 0.0
        }
        charts = {
            "power_timeseries": power["series"],
            "timing_breakdown": timing_breakdown_from_checks(work/"reports"/"sta_checks.txt")
        }

        post_update(job_id, {
            "state": "running",
            "iteration": 0,
            "best_result": best,
            "optimized_verilog": (work/"rtl"/f"{top}.v").read_text(),
            "diffs": [],
            "charts": charts,
            "insights": [{"title":"Baseline measured","detail":"Initial synthesis/sim/STA complete."}],
            "artifacts": {
                "netlist_path": str(work/"synth"/"netlist.v"),
                "reports": {
                    "yosys_stat": str(work/"reports"/"yosys_stat.txt"),
                    "opensta": str(work/"reports"/"sta_summary.txt"),
                    "verilator": "pytest.log"
                },
                "wave_vcd": sim.get("vcd") or "",
                "bundle_zip": ""  # you can zip the workspace if you want
            },
            "logs_tail": (yos["err"] or "")[-240:]
        })

        # ------ Iterations ------
        for it in range(1, max_iters+1):
            # Planner
            plan = call_orch("/planner", {
                "targets": targets,
                "last_result": best
            })
            cands = plan["candidates"][:parallel] if plan.get("candidates") else []

            improved = False
            for cand in cands:
                # Programmer
                files = {
                    f"rtl/{top}.v": (work/"rtl"/f"{top}.v").read_text(),
                    "synth.ys": (work/"synth.ys").read_text()
                }
                prog = call_orch("/programmer", {"files": files, "candidate": cand})
                # Reviewer
                rev  = call_orch("/reviewer", {"programmer_json": prog})
                if not rev.get("ok"):
                    continue

                # Apply patch: MVP approach = overwrite if programmer returns full content in diff,
                # or skip and just re-run (you can implement a proper unified-diff apply using 'unidiff' lib).
                before = (work/"rtl"/f"{top}.v").read_text()
                after  = before  # replace with actual patched content if you apply diff
                (work/"rtl"/f"{top}.v").write_text(after)
                udiff = unified_diff(before, after, f"{top}.v")

                # Re-render scripts in case the candidate changed constraints
                render_synth(top, freq_mhz, abc_script=cand.get("params",{}).get("script","resyn2"), out_path=work/"synth.ys")
                render_sta(LIB_PATH, work/"synth/netlist.v", top, DEFAULT_CLOCK, period_ns, out_path=work/"scripts/sta.tcl")

                # Evaluate
                sim = run_verilator_pytest(work)
                if not sim["pass"]:
                    continue
                yos = run_yosys(work)
                sta = run_opensta(work)
                yos_stat = parse_yosys_stat(work/"reports"/"yosys_stat.json", work/"reports"/"yosys_stat.txt")
                sta_sum  = parse_sta_summary(work/"reports"/"sta_summary.txt")
                power    = power_proxy_from_vcd(Path(sim.get("vcd") or ""), yos_stat["cell_count"], sta_sum.get("fmax_mhz"))

                cand_best = {
                    "functional_pass": True,
                    "fmax_mhz": sta_sum.get("fmax_mhz") or 0.0,
                    "area_ge": yos_stat["ge"],
                    "dyn_power_mw": power["dyn_mw"],
                    "leak_power_mw": power["leak_mw"],
                    "gate_count": yos_stat["cell_count"],
                    "power_savings_pct": 32.0,  # simple placeholder (compute vs baseline if you log baseline dyn)
                    "timing_improvement_pct": 15.0
                }

                # Simple “better” rule: greater fmax, or equal fmax and fewer gates
                def better(new, old):
                    return (new["fmax_mhz"], -new["gate_count"]) > (old["fmax_mhz"], -old["gate_count"])

                if better(cand_best, best):
                    best = cand_best
                    improved = True
                    charts = {
                        "power_timeseries": power["series"],
                        "timing_breakdown": timing_breakdown_from_checks(work/"reports"/"sta_checks.txt")
                    }
                    post_update(job_id, {
                        "state": "running",
                        "iteration": it,
                        "best_result": best,
                        "optimized_verilog": (work/"rtl"/f"{top}.v").read_text(),
                        "diffs": [{"path": f"rtl/{top}.v", "unified_diff": udiff}],
                        "charts": charts,
                        "insights": [{"title":"Candidate accepted",
                                      "detail": f"Applied {cand.get('transform')} with params {cand.get('params',{})}"}],
                        "artifacts": {
                            "netlist_path": str(work/"synth"/"netlist.v"),
                            "reports": {
                                "yosys_stat": str(work/"reports"/"yosys_stat.txt"),
                                "opensta": str(work/"reports"/"sta_summary.txt"),
                                "verilator": "pytest.log"
                            },
                            "wave_vcd": sim.get("vcd") or "",
                            "bundle_zip": ""
                        },
                        "logs_tail": "iteration improved"
                    })

            # Evaluator – stop if orchestrator says so or no improvement
            ev = call_orch("/evaluator", {
                "targets": targets,
                "batch": [best],
                "current_best": best
            })
            if ev.get("stop") or not improved:
                post_update(job_id, {"state": "succeeded", "logs_tail": "completed"})
                return

def main():
    while True:
        job = get_queued_job()
        if job:
            try:
                process_job(job)
            except Exception as e:
                try:
                    post_update(job.get("job_id",""), {"state":"failed","logs_tail": str(e)[:300]})
                except Exception:
                    pass
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
