import { supabase } from "@/integrations/supabase/client";

const USE_MOCK = (import.meta.env.VITE_USE_MOCK_API ?? "0") === "1";
const API_BASE = (import.meta.env.VITE_API_BASE ?? "").trim();

export type Targets = {
  max_area?: number | null;
  min_fmax_mhz?: number | null;
  max_power_mw?: number | null;
};
export type Budgets = { max_iters?: number };

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

/* ----------------------------- MOCK BACKEND ----------------------------- */
let mockDB: Record<string, any> = {};
async function mock_start(payload: {
  original_verilog: string;
  top_module: string;
  targets: Targets;
  budgets?: Budgets;
}) {
  const job_id = `job-${Date.now()}`;
  mockDB[job_id] = {
    state: "queued",
    iteration: 0,
    best_result: null,
    logs_tail: "queued...\n",
  };
  // fake progress
  setTimeout(() => { mockDB[job_id].state = "running"; mockDB[job_id].logs_tail += "running...\n"; }, 800);
  setTimeout(() => {
    mockDB[job_id].iteration = 1;
    mockDB[job_id].best_result = {
      metrics: { fmax_mhz: 210, wns_ns: 0.15, area_eq_gates: 1320, power_mw: 12.3 },
      candidate_rtl: payload.original_verilog.replace("a+b", "(a+b)+1"),
      diff_unified: "--- a\n+++ b\n@@\n- assign y=a+b;\n+ assign y=(a+b)+1;\n",
    };
    mockDB[job_id].logs_tail += "iter 1 complete\n";
  }, 1800);
  setTimeout(() => { mockDB[job_id].state = "succeeded"; mockDB[job_id].logs_tail += "done.\n"; }, 3200);
  return { job_id };
}
async function mock_status(job_id: string) {
  return mockDB[job_id] ?? { state: "queued" };
}
async function mock_stop(job_id: string) {
  if (mockDB[job_id]) mockDB[job_id].state = "stopped";
  return { ok: true };
}

/* ---------------------------- REAL FASTAPI ------------------------------ */
async function real_start(payload: {
  original_verilog: string;
  top_module: string;
  targets: Targets;
  budgets?: Budgets;
}) {
  const headers = await authHeaders();
  const r = await fetch(`${API_BASE}/optimize/start`, {
    method: "POST", headers, body: JSON.stringify({
      rtl_text: payload.original_verilog, // if your backend expects rtl_text
      rtl_top: payload.top_module,
      targets: payload.targets,
      max_iters: payload.budgets?.max_iters ?? 3,
    })
  });
  if (!r.ok) throw new Error(await r.text());
  // expected: { task_id, job_id }
  return r.json();
}
async function real_status(task_id_or_job_id: string) {
  const headers = await authHeaders();
  // If your backend returns task_id, use /status/{task_id}.
  // If it returns job_id, switch the path accordingly.
  const r = await fetch(`${API_BASE}/optimize/status/${task_id_or_job_id}`, { headers });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function real_stop(job_id: string) {
  const headers = await authHeaders();
  const r = await fetch(`${API_BASE}/optimize/stop?job_id=${encodeURIComponent(job_id)}`, { method: "POST", headers });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ------------------------------ EXPORTS --------------------------------- */
export async function startOptimization(payload: {
  original_verilog: string;
  top_module: string;
  targets: Targets;
  budgets?: Budgets;
}) { return USE_MOCK ? mock_start(payload) : real_start(payload); }

export async function getOptimizationStatus(id: string) {
  return USE_MOCK ? mock_status(id) : real_status(id);
}

export async function stopOptimization(job_id: string) {
  return USE_MOCK ? mock_stop(job_id) : real_stop(job_id);
}
