// src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function startOptimization(job: {
  top_module: string;
  original_verilog: string;
  targets?: Record<string, any>;
  budgets?: Record<string, any>;
}) {
  const r = await fetch(`${API_BASE}/api/start-optimization`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{ status: string; job_id: string }>;
}

export async function getOptimizationStatus(jobId: string) {
  const r = await fetch(`${API_BASE}/api/get-optimization-status?job_id=${jobId}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{ job: any }>;
}
