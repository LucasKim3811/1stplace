# VeriRL Architecture Overview

## System Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (Lovable)                        │
│  - React/TypeScript UI                                      │
│  - Optimizer page with input/output panels                  │
│  - Real-time job status polling                             │
└──────────────────┬──────────────────────────────────────────┘
                   │ REST API
                   ↓
┌─────────────────────────────────────────────────────────────┐
│              LOVABLE CLOUD (Built & Deployed)               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Edge Functions (Deno/TypeScript)                    │   │
│  │  - start-optimization                               │   │
│  │  - get-optimization-status                          │   │
│  │  - stop-optimization                                │   │
│  │  - llm-orchestrator (calls Lovable AI)             │   │
│  │  - eda-worker-callback                              │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ PostgreSQL Database                                 │   │
│  │  - optimization_jobs table                          │   │
│  │  - Job tracking & results storage                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Lovable AI (Pre-configured)                         │   │
│  │  - google/gemini-2.5-flash                          │   │
│  │  - Handles: planner, programmer, reviewer,          │   │
│  │    evaluator roles                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Storage                                             │   │
│  │  - optimization-artifacts bucket                    │   │
│  │  - Netlists, reports, VCD files                     │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────────┘
                   │ Polling (every 10s)
                   ↓
┌─────────────────────────────────────────────────────────────┐
│         EXTERNAL WORKER (You Must Deploy)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Python Worker                                       │   │
│  │  - Polls for queued jobs                            │   │
│  │  - Orchestrates optimization loop                   │   │
│  │  - Posts results back via callback                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Docker Container with EDA Tools                     │   │
│  │  - Yosys (synthesis)                                │   │
│  │  - Verilator (simulation)                           │   │
│  │  - OpenSTA (timing analysis)                        │   │
│  │  - CoCoTb (testbenches)                             │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Tool Wrappers (Python)                              │   │
│  │  - run_yosys() → parse_yosys_stat()                │   │
│  │  - run_verilator() → functional pass/fail          │   │
│  │  - run_opensta() → parse_sta()                     │   │
│  │  - power_from_vcd() → power metrics                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Job Submission
```
User clicks "Run Optimization"
  → Frontend calls POST /start-optimization
    → Cloud creates job (state='queued') in DB
      → Returns job_id to frontend
        → Frontend starts polling GET /get-optimization-status
```

### 2. Worker Processing
```
External worker polls DB every 10s
  → Finds job with state='queued'
    → Updates to state='running'
      → Runs baseline (Yosys + Verilator + OpenSTA)
        → Posts baseline results via POST /eda-worker-callback
          → For each iteration:
            → Calls POST /llm-orchestrator (role='planner')
              ← Gets optimization candidates
            → For each candidate:
              → Calls POST /llm-orchestrator (role='programmer')
                ← Gets Verilog patches
              → Calls POST /llm-orchestrator (role='reviewer')
                ← Validates patches
              → Runs EDA tools on patched design
              → Scores results
            → Updates best result via POST /eda-worker-callback
            → Calls POST /llm-orchestrator (role='evaluator')
              ← Decides stop/continue
          → Final update: state='succeeded'
```

### 3. Frontend Updates
```
Frontend polls GET /get-optimization-status every 2s
  → Displays: iteration, state, logs_tail
    → Shows best_result metrics (power, timing, area)
      → Renders charts from charts field
        → Shows diffs from diffs field
```

## Technology Stack

| Component | Technology | Notes |
|-----------|-----------|-------|
| **Frontend** | React + TypeScript + Vite | Already in Lovable project |
| **Backend API** | Deno Edge Functions | Auto-deployed with Lovable Cloud |
| **Database** | PostgreSQL (Supabase) | Managed by Lovable Cloud |
| **LLM** | Lovable AI (Gemini 2.5 Flash) | Pre-configured, no API key needed |
| **Storage** | Supabase Storage | For artifacts/files |
| **Worker** | Python 3.11+ | You deploy externally |
| **EDA Tools** | Yosys, Verilator, OpenSTA | In Docker on your infrastructure |

## API Contract

### POST /start-optimization
**Request:**
```json
{
  "design_name": "counter",
  "top_module": "counter",
  "targets": {
    "frequency_mhz": 500,
    "max_area_ge": 12000,
    "max_power_mw": 50
  },
  "budgets": {
    "max_iters": 20,
    "max_parallel": 3,
    "timeout_s": 1800
  },
  "testbench": {
    "kind": "cocotb",
    "path": "tb/"
  },
  "device": {
    "type": "asic",
    "lib": "sky130",
    "vdd": 1.8
  },
  "preference": ["timing", "power", "area"],
  "original_verilog": "module counter(...);"
}
```

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Job queued"
}
```

### GET /get-optimization-status?job_id=<uuid>
**Response:**
```json
{
  "job_id": "550e8400-...",
  "state": "running",
  "iteration": 5,
  "spec": { ... },
  "best_result": {
    "functional_pass": true,
    "power_savings_pct": 32.0,
    "timing_improvement_pct": 15.0,
    "gate_count": 142,
    "fmax_mhz": 540.0,
    "area_ge": 10980,
    "dyn_power_mw": 42.0,
    "leak_power_mw": 2.0
  },
  "optimized_verilog": "module counter_opt(...)...",
  "diffs": [
    {
      "path": "rtl/counter.v",
      "unified_diff": "--- a/counter.v\n+++ b/counter.v\n..."
    }
  ],
  "charts": {
    "power_timeseries": [
      {"t": 0, "mw": 60},
      {"t": 1, "mw": 58}
    ],
    "timing_breakdown": [
      {"stage": "comb", "ns": 1.52},
      {"stage": "clkq", "ns": 0.12}
    ]
  },
  "insights": [
    {
      "title": "Clock Gating Applied",
      "detail": "Reduced dynamic power by 32% through selective clock gating"
    }
  ],
  "artifacts": {
    "netlist_path": "/artifacts/counter_opt.v",
    "reports": {
      "yosys_stat": "/artifacts/yosys.txt",
      "opensta": "/artifacts/sta.txt"
    },
    "wave_vcd": "/artifacts/counter.vcd",
    "bundle_zip": "/artifacts/bundle.zip"
  },
  "logs_tail": "Iteration 5 complete, evaluating stop condition..."
}
```

### POST /stop-optimization
**Request:**
```json
{
  "job_id": "550e8400-..."
}
```

**Response:**
```json
{
  "ok": true
}
```

### POST /llm-orchestrator
**Request:**
```json
{
  "role": "planner",
  "payload": {
    "targets": {"frequency_mhz": 500, ...},
    "last_result": {...},
    "allowed": ["pipeline_depth", "unroll_factor", ...]
  }
}
```

**Response:**
```json
{
  "candidates": [
    {
      "transform": "pipeline_depth",
      "params": {"depth": 3},
      "rationale": "Adding pipeline stages improves fmax"
    }
  ]
}
```

### POST /eda-worker-callback
**Request:**
```json
{
  "job_id": "550e8400-...",
  "state": "running",
  "iteration": 5,
  "best_result": {...},
  "optimized_verilog": "...",
  "logs_tail": "Processing iteration 5"
}
```

**Response:**
```json
{
  "ok": true
}
```

## Database Schema

### optimization_jobs Table
```sql
CREATE TABLE public.optimization_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT UNIQUE NOT NULL,
  state TEXT NOT NULL DEFAULT 'queued', -- queued|running|succeeded|failed|stopped
  iteration INTEGER DEFAULT 0,
  spec JSONB NOT NULL,
  best_result JSONB,
  optimized_verilog TEXT,
  diffs JSONB DEFAULT '[]'::jsonb,
  charts JSONB DEFAULT '{}'::jsonb,
  insights JSONB DEFAULT '[]'::jsonb,
  artifacts JSONB,
  logs_tail TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Security Notes

- All endpoints are public (`verify_jwt = false`) for demo purposes
- For production: Add authentication, rate limiting, input validation
- Worker should validate job ownership before processing
- Use environment variables for sensitive config (URLs, keys)

## Deployment Checklist

### Lovable Cloud (Already Done ✅)
- [x] Database tables created
- [x] Edge functions deployed
- [x] Lovable AI enabled
- [x] Storage bucket created
- [x] RLS policies configured

### External Worker (Your Responsibility ❌)
- [ ] Set up Docker with EDA tools
- [ ] Implement Python worker script
- [ ] Add tool wrappers (Yosys, Verilator, OpenSTA)
- [ ] Add parsers for tool outputs
- [ ] Deploy to cloud VM / K8s / Docker host
- [ ] Configure polling interval
- [ ] Add error handling & logging
- [ ] Test end-to-end flow

## Next Steps

1. **Read `BACKEND_DEPLOYMENT.md`** for detailed worker implementation guide
2. **Test API endpoints** using curl/Postman to verify Lovable Cloud is working
3. **Build external worker** following the Python example
4. **Deploy worker** to your infrastructure
5. **Integrate frontend** with API endpoints
6. **Test end-to-end** with real Verilog designs