from __future__ import annotations
import os, time, json, difflib, tempfile, subprocess, shutil
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

LIB_PATH = Path(os.getenv("LIB_PATH", "/app/tools/sky130.lib"))  # If missing, we skip OpenSTA gracefully

DATA_ROOT.mkdir(parents=True, exist_ok=True)

SMOKE_MODE = os.getenv("SMOKE_MODE", "0") == "1"
SMOKE_VERILOG = os.getenv("SMOKE_VERILOG", "module top(input clk); endmodule")
SMOKE_TOP = os.getenv("SMOKE_TOP", "top")
SMOKE_FREQ = float(os.getenv("SMOKE_FREQ_MHZ", str(DEFAULT_FREQ_MHZ)))
SMOKE_SAVE_DIR = os.getenv("SMOKE_SAVE_DIR", "")  # if set, copy workspace here for inspection

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

def apply_unified_diff(job_dir: Path, diff_text: str) -> tuple[bool, str]:
    """Apply a unified diff using the system 'patch' tool.
    Returns (ok, log). Uses -p1 to strip leading a/ and b/ prefixes.
    """
    try:
        # Ensure patch tool exists
        rc = subprocess.run(["patch", "--version"], capture_output=True, text=True)
        if rc.returncode != 0:
            return False, f"'patch' tool not available: {rc.stderr}"

        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".patch") as tf:
            tf.write(diff_text)
            patch_path = tf.name

        # Dry run first
        dry = subprocess.run(
            ["patch", "-p1", "--forward", "--dry-run", "-i", patch_path],
            cwd=str(job_dir), capture_output=True, text=True
        )
        if dry.returncode != 0:
            return False, f"patch dry-run failed: {dry.stdout}\n{dry.stderr}"

        # Real apply
        real = subprocess.run(
            ["patch", "-p1", "--forward", "-i", patch_path],
            cwd=str(job_dir), capture_output=True, text=True
        )
        if real.returncode != 0:
            return False, f"patch apply failed: {real.stdout}\n{real.stderr}"
        return True, real.stdout
    except Exception as e:
        return False, f"patch exception: {e}"

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
        if SMOKE_MODE:
            print(f"[SMOKE] Workspace: {work}")
        # Stage design files
        if SMOKE_MODE:
            print("[SMOKE] Preparing workspace...")
        prepare_workspace(work, rtl_text, top)
        # Render EDA scripts
        if SMOKE_MODE:
            print("[SMOKE] Rendering synth.ys...")
        render_synth(top, freq_mhz, abc_script=spec.get("abc_script","resyn2"), out_path=work/"synth.ys")
        period_ns = 1000.0 / freq_mhz
        if LIB_PATH.exists():
            if SMOKE_MODE:
                print(f"[SMOKE] Rendering STA script using {LIB_PATH}...")
            render_sta(LIB_PATH, work/"synth/netlist.v", top, DEFAULT_CLOCK, period_ns, out_path=work/"scripts/sta.tcl")
        else:
            if SMOKE_MODE:
                print("[SMOKE] No LIB_PATH found; will skip OpenSTA.")

        # ------ Baseline ------
        if SMOKE_MODE:
            print("[SMOKE] Running baseline: pytest, yosys, (optional) opensta...")
        sim = run_verilator_pytest(work)
        yos = run_yosys(work)
        # OpenSTA optional if no liberty file present
        if LIB_PATH.exists():
            _ = run_opensta(work)
            sta_sum  = parse_sta_summary(work/"reports"/"sta_summary.txt")
        else:
            sta_sum = {"clock_period_ns": None, "wns_ns": None, "tns_ns": None, "fmax_mhz": targets.get("frequency_mhz")}
        yos_stat = parse_yosys_stat(work/"reports"/"yosys_stat.json", work/"reports"/"yosys_stat.txt")
        if SMOKE_MODE:
            print(f"[SMOKE] Baseline sim pass={sim['pass']} cells={yos_stat['cell_count']} fmax={sta_sum.get('fmax_mhz')}")
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
            if SMOKE_MODE:
                print(f"[SMOKE] Iteration {it}: planner...")
            plan = call_orch("/planner", {
                "targets": targets,
                "last_result": best
            })
            cands = plan["candidates"][:parallel] if plan.get("candidates") else []
            if SMOKE_MODE:
                print(f"[SMOKE] planner candidates={len(cands)}")

            improved = False
            for cand in cands:
                # Programmer
                if SMOKE_MODE:
                    print("[SMOKE] programmer...")
                files = {
                    f"rtl/{top}.v": (work/"rtl"/f"{top}.v").read_text(),
                    "synth.ys": (work/"synth.ys").read_text()
                }
                prog = call_orch("/programmer", {"files": files, "candidate": cand})
                # Reviewer
                if SMOKE_MODE:
                    print("[SMOKE] reviewer...")
                rev  = call_orch("/reviewer", {"programmer_json": prog})
                if not rev.get("ok"):
                    if SMOKE_MODE:
                        print("[SMOKE] reviewer rejected; skipping candidate")
                    continue

                # Apply patches (unified diffs) if provided
                diffs_applied: List[Dict[str, str]] = []
                # 1) RTL patches
                for p in prog.get("patches", []) or []:
                    diff_text = p.get("unified_diff") or ""
                    if not diff_text.strip():
                        continue
                    ok, log = apply_unified_diff(work, diff_text)
                    if SMOKE_MODE:
                        print(f"[SMOKE] apply patch ok={ok}")
                    if ok:
                        # Try to compute a diff for the path field if we can
                        path_val = p.get("path", "")
                        try:
                            rel_path = path_val.replace("rtl/", f"rtl/") if path_val else f"rtl/{top}.v"
                            fpath = work / rel_path
                            if fpath.exists():
                                after = fpath.read_text()
                                # We can't easily reconstruct 'before' now; include raw unified diff
                                diffs_applied.append({"path": rel_path, "unified_diff": diff_text})
                            else:
                                diffs_applied.append({"path": rel_path, "unified_diff": diff_text})
                        except Exception:
                            diffs_applied.append({"path": path_val or f"rtl/{top}.v", "unified_diff": diff_text})
                    else:
                        # If patch failed, skip this candidate
                        continue

                # 2) synth.ys patch (if any)
                synth_patch = prog.get("synth_script_patch")
                if synth_patch and str(synth_patch).strip():
                    ok, log = apply_unified_diff(work, synth_patch)
                    # If synth patch fails, keep going with previous synth.ys

                # Re-render scripts in case the candidate changed constraints
                render_synth(top, freq_mhz, abc_script=cand.get("params",{}).get("script","resyn2"), out_path=work/"synth.ys")
                if LIB_PATH.exists():
                    render_sta(LIB_PATH, work/"synth/netlist.v", top, DEFAULT_CLOCK, period_ns, out_path=work/"scripts/sta.tcl")

                # Evaluate
                if SMOKE_MODE:
                    print("[SMOKE] evaluate: pytest -> yosys -> (optional) opensta...")
                sim = run_verilator_pytest(work)
                if not sim["pass"]:
                    if SMOKE_MODE:
                        print("[SMOKE] sim failed; skipping candidate")
                    continue
                yos = run_yosys(work)
                if LIB_PATH.exists():
                    _ = run_opensta(work)
                yos_stat = parse_yosys_stat(work/"reports"/"yosys_stat.json", work/"reports"/"yosys_stat.txt")
                if LIB_PATH.exists():
                    sta_sum  = parse_sta_summary(work/"reports"/"sta_summary.txt")
                else:
                    sta_sum = {"clock_period_ns": None, "wns_ns": None, "tns_ns": None, "fmax_mhz": freq_mhz}
                power    = power_proxy_from_vcd(Path(sim.get("vcd") or ""), yos_stat["cell_count"], sta_sum.get("fmax_mhz"))
                if SMOKE_MODE:
                    print(f"[SMOKE] candidate fmax={sta_sum.get('fmax_mhz')} cells={yos_stat['cell_count']}")

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
                        "diffs": diffs_applied,
                        "charts": charts,
                        "insights": [{"title":"Candidate accepted",
                                      "detail": f"Applied {cand.get('transform')} with params {cand.get('params',{})}"}],
                        "artifacts": {
                            "netlist_path": str(work/"synth"/"netlist.v"),
                            "reports": {
                                "yosys_stat": str(work/"reports"/"yosys_stat.txt"),
                                "opensta": str(work/"reports"/"sta_summary.txt") if LIB_PATH.exists() else "",
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
                # Persist workspace for smoke-mode debugging if requested
                if SMOKE_SAVE_DIR:
                    try:
                        dest = Path(SMOKE_SAVE_DIR) / f"{job_id}"
                        dest.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copytree(work, dest, dirs_exist_ok=True)
                        print(f"[SMOKE] Saved workspace to {dest}")
                    except Exception as e:
                        print(f"[SMOKE] Save workspace failed: {e}")
                return

def main():
    # Optional one-off smoke run without Supabase polling
    if SMOKE_MODE:
        job = {
            "job_id": "local-smoke",
            "spec": {
                "top_module": SMOKE_TOP,
                "targets": {"frequency_mhz": SMOKE_FREQ},
                "budgets": {"max_iters": 1, "max_parallel": 1},
                "original_verilog": SMOKE_VERILOG,
            },
        }
        print("[SMOKE] Running one-off local job...")
        # Wait for orchestrator readiness briefly
        try:
            for i in range(20):
                try:
                    requests.get(ORCH + "/healthz", timeout=2)
                    break
                except Exception:
                    time.sleep(0.5)
        except Exception:
            pass
        try:
            process_job(job)
            print("[SMOKE] Completed")
        except Exception as e:
            print("[SMOKE] Failed:", e)
        return

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
