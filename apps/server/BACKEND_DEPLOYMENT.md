# VeriRL Backend Deployment Guide

## ✅ What Lovable Cloud Provides (Already Built)

### Database & API
- **PostgreSQL database** with `optimization_jobs` table
- **REST API endpoints** (Deno edge functions):
  - `POST /start-optimization` - Submit new optimization job
  - `GET /get-optimization-status?job_id=<id>` - Get job status
  - `POST /stop-optimization` - Stop running job
  - `POST /eda-worker-callback` - External worker updates job status
  - `POST /llm-orchestrator` - LLM role calls (planner, programmer, reviewer, evaluator)

### LLM Integration
- **Lovable AI** enabled with `google/gemini-2.5-flash` model
- Handles: planner, programmer, reviewer, evaluator roles
- No API keys needed (pre-configured)

### Storage
- **Supabase Storage bucket**: `optimization-artifacts`
- For storing netlists, reports, VCD files, bundles

---

## ❌ What You Need to Deploy Externally

You need to deploy a **Python-based EDA worker** that:
1. Polls Lovable Cloud for queued jobs
2. Runs EDA tools (Yosys, Verilator, OpenSTA)
3. Posts results back to Lovable Cloud

### Architecture
```
Frontend (Lovable)
    ↓ POST /start-optimization
Lovable Cloud API (job created, state='queued')
    ↑ polls every 10s
External EDA Worker (Python + Docker)
    ↓ POST /eda-worker-callback
Lovable Cloud (updates job state/results)
    ↑ GET /get-optimization-status
Frontend (displays results)
```

---

## External Worker Implementation

### 1. Polling Worker (Python)
```python
# worker.py
import requests
import time
import json
from typing import Optional

CLOUD_URL = "https://waaaowaetxrxpdfrmwvm.supabase.co/functions/v1"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhYWFvd2FldHhyeHBkZnJtd3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MzgxNzIsImV4cCI6MjA3NjIxNDE3Mn0.q0K2BGnh27t9bb1ifeqQV2XJiNy0FJxbHXhyWzt7-kE"

def poll_for_jobs():
    """Poll database for queued jobs"""
    # Query optimization_jobs table where state='queued'
    # You'll need to implement direct Supabase REST API calls
    pass

def process_job(job):
    """Main optimization loop"""
    job_id = job['job_id']
    spec = job['spec']
    
    # Update to 'running'
    update_job(job_id, {'state': 'running', 'logs_tail': 'Starting baseline...'})
    
    # 1. Baseline run
    baseline = run_baseline(spec)
    update_job(job_id, {
        'iteration': 0,
        'best_result': baseline,
        'logs_tail': 'Baseline complete'
    })
    
    # 2. Optimization loop
    for iteration in range(1, spec['budgets']['max_iters'] + 1):
        # Check if stopped
        current_state = get_job_state(job_id)
        if current_state == 'stopped':
            break
            
        update_job(job_id, {'iteration': iteration, 'logs_tail': f'Iter {iteration} planning...'})
        
        # Call LLM planner
        candidates = call_llm('planner', {
            'targets': spec['targets'],
            'last_result': baseline,
            'allowed': ['pipeline_depth', 'unroll_factor', 'fsm_encoding']
        })
        
        # Evaluate candidates
        results = []
        for cand in candidates['candidates']:
            # Call programmer
            patches = call_llm('programmer', {'candidate': cand, 'verilog': baseline['verilog']})
            
            # Call reviewer
            review = call_llm('reviewer', {'patches': patches})
            if not review['ok']:
                continue
                
            # Run EDA tools
            result = run_eda_tools(spec, patches)
            results.append(result)
        
        # Update best
        if results:
            best = max(results, key=lambda x: x['score'])
            update_job(job_id, {
                'best_result': best,
                'optimized_verilog': best['verilog'],
                'diffs': best['diffs'],
                'charts': best['charts'],
                'logs_tail': f'Iter {iteration} complete'
            })
            
            # Call evaluator
            decision = call_llm('evaluator', {
                'targets': spec['targets'],
                'batch': results,
                'current_best': best
            })
            
            if decision.get('stop'):
                update_job(job_id, {'state': 'succeeded'})
                return
    
    update_job(job_id, {'state': 'succeeded'})

def call_llm(role: str, payload: dict):
    """Call Lovable Cloud LLM orchestrator"""
    resp = requests.post(
        f"{CLOUD_URL}/llm-orchestrator",
        headers={'Authorization': f'Bearer {ANON_KEY}', 'Content-Type': 'application/json'},
        json={'role': role, 'payload': payload}
    )
    return resp.json()

def update_job(job_id: str, updates: dict):
    """Post updates back to Lovable Cloud"""
    requests.post(
        f"{CLOUD_URL}/eda-worker-callback",
        headers={'Authorization': f'Bearer {ANON_KEY}', 'Content-Type': 'application/json'},
        json={'job_id': job_id, **updates}
    )

def run_baseline(spec):
    """Run initial EDA flow"""
    # 1. run_verilator (functional sim)
    # 2. run_yosys (synthesis)
    # 3. run_opensta (timing)
    # 4. parse results
    return {
        'functional_pass': True,
        'fmax_mhz': 480.0,
        'area_ge': 10980,
        'dyn_power_mw': 60.0,
        'leak_power_mw': 2.0,
        'gate_count': 142,
        'power_savings_pct': 0.0,
        'timing_improvement_pct': 0.0
    }

def run_eda_tools(spec, patches):
    """Apply patches and run full EDA flow"""
    # 1. Apply patches to verilog
    # 2. Run verilator (sim + cocotb)
    # 3. Run yosys (synthesis with abc_script from patch)
    # 4. Run opensta (STA)
    # 5. Parse VCD for power
    # 6. Generate diffs, charts, insights
    pass

if __name__ == '__main__':
    while True:
        jobs = poll_for_jobs()
        for job in jobs:
            try:
                process_job(job)
            except Exception as e:
                update_job(job['job_id'], {
                    'state': 'failed',
                    'logs_tail': f'Error: {str(e)}'
                })
        time.sleep(10)
```

### 2. Docker Setup
```dockerfile
# Dockerfile.worker
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    python3 python3-pip git make build-essential \
    yosys verilator iverilog tcl tk \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install requests cocotb pytest

WORKDIR /worker
COPY worker.py /worker/
COPY eda_tools.py /worker/

CMD ["python3", "worker.py"]
```

### 3. Deploy Worker
```bash
# Option A: Docker Compose
docker-compose up worker

# Option B: Kubernetes
kubectl apply -f worker-deployment.yaml

# Option C: Cloud VM (AWS/GCP/Azure)
# SSH into VM, install deps, run worker.py as systemd service
```

---

## API Endpoints Reference

### Frontend → Lovable Cloud

**Start Optimization**
```bash
curl -X POST https://waaaowaetxrxpdfrmwvm.supabase.co/functions/v1/start-optimization \
  -H "Content-Type: application/json" \
  -d '{
    "design_name": "counter",
    "top_module": "counter",
    "targets": {"frequency_mhz": 500, "max_area_ge": 12000, "max_power_mw": 50},
    "budgets": {"max_iters": 20, "max_parallel": 3, "timeout_s": 1800},
    "original_verilog": "module counter(...);"
  }'

# Response: {"job_id": "abc-123-def"}
```

**Get Status**
```bash
curl "https://waaaowaetxrxpdfrmwvm.supabase.co/functions/v1/get-optimization-status?job_id=abc-123-def"
```

### Worker → Lovable Cloud

**Update Job**
```python
requests.post(
    "https://waaaowaetxrxpdfrmwvm.supabase.co/functions/v1/eda-worker-callback",
    headers={"Authorization": f"Bearer {ANON_KEY}"},
    json={
        "job_id": "abc-123-def",
        "state": "running",
        "iteration": 5,
        "best_result": {...},
        "logs_tail": "Iteration 5 complete"
    }
)
```

**Call LLM**
```python
requests.post(
    "https://waaaowaetxrxpdfrmwvm.supabase.co/functions/v1/llm-orchestrator",
    json={
        "role": "planner",
        "payload": {"targets": {...}, "last_result": {...}}
    }
)
```

---

## What Still Needs Building

### Critical (MVP)
1. ✅ Database polling logic (query `optimization_jobs` where `state='queued'`)
2. ✅ EDA tool wrappers (`run_yosys`, `run_verilator`, `run_opensta`)
3. ✅ Result parsers (`parse_yosys_stat`, `parse_sta`, `power_from_vcd`)
4. ✅ Patch application logic (unified diff or full file replace)

### Optional (Polish)
5. ⚠️ Caching (hash design+transform → skip if seen)
6. ⚠️ Parallel candidate evaluation (Docker Swarm/K8s jobs)
7. ⚠️ Artifact upload to Supabase Storage
8. ⚠️ Timeout/retry handling

---

## Quick Start (2-Day Plan)

**Day 1 (8 hours)**
- Hour 0-2: Set up Docker image with Yosys/Verilator
- Hour 2-4: Implement `run_yosys` and basic parser
- Hour 4-6: Implement `run_verilator` and functional check
- Hour 6-8: Connect polling loop + callback to Lovable Cloud

**Day 2 (8 hours)**
- Hour 0-2: Add `run_opensta` and timing parser
- Hour 2-4: Implement power estimation from VCD
- Hour 4-6: Add LLM integration (planner/programmer/reviewer)
- Hour 6-8: End-to-end test + artifact generation

---

## Testing

### Mock Test (No EDA Tools)
```python
# Return fake results to verify frontend integration
def run_baseline(spec):
    return {'functional_pass': True, 'fmax_mhz': 480, ...}
```

### Real Test (With Tools)
```bash
# Test Yosys
cd /tmp
echo "module test(input a, output b); assign b = a; endmodule" > test.v
yosys -p "read_verilog test.v; synth; stat"

# Test Verilator
verilator --lint-only test.v
```

---

## Support

- **Lovable Cloud logs**: Check edge function logs in Lovable backend panel
- **Worker logs**: `docker logs worker-container`
- **Database inspection**: Query `optimization_jobs` table directly

**Questions?** Contact the team or check Lovable docs.