from __future__ import annotations
import os, subprocess, shutil
from pathlib import Path
from typing import Dict, Any
from jinja2 import Environment, FileSystemLoader

# Prefer mounted /tools; fallback to repo-relative tools dir
TOOLS_DIR_CANDIDATES = [
    Path(os.getenv("TOOLS_DIR", "/tools")),
    Path(__file__).resolve().parent.parent / "tools",
]
TOOLS_DIR = next((p for p in TOOLS_DIR_CANDIDATES if p.exists()), TOOLS_DIR_CANDIDATES[-1])

def run(cmd: str, cwd: Path, timeout: int = 900) -> tuple[int, str, str]:
    p = subprocess.run(cmd, cwd=str(cwd), shell=True, capture_output=True, text=True, timeout=timeout)
    return p.returncode, p.stdout, p.stderr

def render_synth(top_module: str, target_freq_mhz: float, abc_script: str, out_path: Path):
    env = Environment(loader=FileSystemLoader(str(TOOLS_DIR)))
    period_ns = 1000.0 / float(target_freq_mhz)
    abc_delay_ps = int(period_ns * 1000.0)
    text = env.get_template("synth.ys.j2").render(
        top_module=top_module,
        abc_delay_ps=abc_delay_ps,
        abc_script=abc_script
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(text)

def render_sta(lib_path: Path, netlist_path: Path, top_module: str, clock_port: str, period_ns: float, out_path: Path):
    env = Environment(loader=FileSystemLoader(str(TOOLS_DIR)))
    text = env.get_template("sta.tcl.j2").render(
        lib_path=str(lib_path),
        netlist_path=str(netlist_path),
        top_module=top_module,
        clock_port=clock_port,
        clock_name=clock_port,
        clock_period_ns=period_ns,
        input_delay_ns=0.10,
        output_delay_ns=0.10
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(text)

def prepare_workspace(job_dir: Path, rtl_text: str, top_module: str):
    (job_dir / "rtl").mkdir(parents=True, exist_ok=True)
    (job_dir / "synth").mkdir(exist_ok=True)
    (job_dir / "reports").mkdir(exist_ok=True)
    (job_dir / "scripts").mkdir(exist_ok=True)
    (job_dir / "tb").mkdir(exist_ok=True)
    (job_dir / "tb" / "test_dummy.py").write_text("def test_ok(): assert True\n")
    (job_dir / "rtl" / f"{top_module}.v").write_text(rtl_text)

def run_verilator_pytest(job_dir: Path, timeout: int = 900) -> Dict[str, Any]:
    rc, out, err = run("pytest -q", cwd=job_dir / "tb", timeout=timeout)
    vcd = next((p for p in job_dir.rglob("*.vcd")), None)
    return {"pass": rc == 0, "log": out + err, "vcd": str(vcd) if vcd else None}

def run_yosys(job_dir: Path, timeout: int = 900) -> Dict[str, Any]:
    rc, out, err = run("yosys -s synth.ys", cwd=job_dir, timeout=timeout)
    return {"rc": rc, "out": out, "err": err}

def run_opensta(job_dir: Path, timeout: int = 900) -> Dict[str, Any]:
    rc, out, err = run("sta -exit scripts/sta.tcl", cwd=job_dir, timeout=timeout)
    return {"rc": rc, "out": out, "err": err}
