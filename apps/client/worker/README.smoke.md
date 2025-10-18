# Worker + Orchestrator Smoke Test (No Supabase)

This guide helps you validate the Member B flow locally: patch application, synth script handling, Yosys run, and optional STA skipping.

## What this validates
- Orchestrator (mock) returns a real unified diff for a Verilog file.
- Worker applies the diff using the system `patch` tool.
- Worker renders and runs `synth.ys` via Yosys.
- Worker optionally runs OpenSTA if a `.lib` is provided; otherwise skips cleanly.
- Worker completes the iteration loop.

## Prerequisites
- Docker Desktop installed.

## Steps

1) Prepare env file
- From this folder (`apps/client/worker`):
  - Copy `config.env.example` to `.env` and edit as needed.
  - For smoke mode, set:
    - `SMOKE_MODE=1`
    - Optionally set `LIB_PATH` to a valid Liberty file (otherwise STA is skipped).
    - Optionally set `SMOKE_SAVE_DIR=/data/jobs/snapshots` to persist the temp workspace.

2) Run orchestrator + worker (mock LLM)

```powershell
cd apps/client/worker
docker compose up --build
```

- The orchestrator runs with `MOCK_ORCH=1` so no external LLM is needed.
- The worker runs with `SMOKE_MODE=1` and executes a one-off local job.
  It waits briefly for the orchestrator `/healthz` endpoint before the first planner call.

3) Check outcomes
- In worker logs, look for:
  - `[SMOKE] Running one-off local job...`
  - `[SMOKE] Workspace: /data/...`
  - `patch` dry-run/apply success messages
  - `iteration improved` or `completed`
- Verify `diffs` are included in the logged callback payloads. If `LOVABLE_CALLBACK_URL` is not live, errors are logged but the flow still completes.

4) Turn off smoke mode
- When ready to integrate with Supabase queueing:
  - Set `SMOKE_MODE=0`
  - Set `LOVABLE_NEXT_JOB_URL` to your new `next-queued-job` function
  - Ensure `LOVABLE_CALLBACK_URL` points to `eda-worker-callback`

## Notes
- If your Programmer diffs do not include `a/` and `b/` prefixes, you may need to adjust the `patch` arguments (e.g., use `-p0`).
- If `patch` is missing in your base image, it's already added to the worker Dockerfile in this repo (`apt-get install patch`).
- For realistic timing, provide a valid `.lib` file and set `LIB_PATH`. Otherwise, STA is skipped and fmax falls back to the target frequency.
 - If the first planner call fails with a connection error, the worker now waits briefly for orchestrator readiness. Re-run if needed.
