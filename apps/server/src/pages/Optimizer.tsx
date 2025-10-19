import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  startOptimization,
  getOptimizationStatus,
  stopOptimization,
  Targets,
} from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

function isTerminal(state?: string) {
  if (!state) return false;
  const s = state.toLowerCase();
  return s === "succeeded" || s === "failed" || s === "stopped" || s === "success" || s === "failure";
}

// Toggle: if VITE_REQUIRE_AUTH=0 → allow anonymous testing
const REQUIRE_AUTH = String(import.meta.env.VITE_REQUIRE_AUTH ?? "1") !== "0";

type MetricCards = {
  powerPct?: number | null;
  timingPct?: number | null;
  gates?: number | null;
};

export default function Optimizer() {
  const { user, loading, signIn, signOut } = useAuth();
  const [search, setSearch] = useSearchParams();
  const qc = useQueryClient();

  // ---------- form ----------
  const [topModule, setTopModule] = useState(search.get("top") ?? "counter");
  const [rtl, setRtl] = useState(
`// Paste your Verilog code here
module counter (
  input clk,
  input rst,
  output reg [7:0] count
);

  always @(posedge clk or posedge rst) begin
    if (rst)
      count <= 8'b0;
    else
      count <= count + 1;
  end

endmodule`
  );

  const [targets, setTargets] = useState<Targets>({
    max_area: 1500,
    min_fmax_mhz: 200,
    max_power_mw: 15,
  });
  const [maxIters, setMaxIters] = useState(3);

  // ui-only target toggles (for the old layout visual)
  const [tPower, setTPower] = useState(true);
  const [tTiming, setTTiming] = useState(true);
  const [tArea, setTArea] = useState(false);

  // ---------- job id ----------
  const initialId = search.get("job");
  const [id, setId] = useState<string | null>(initialId);

  const canRun = !REQUIRE_AUTH || !!user;

  // ---------- start job ----------
  const startMut = useMutation({
    mutationFn: async () => {
      const res = await startOptimization({
        original_verilog: rtl,
        top_module: topModule,
        targets,
        budgets: { max_iters: maxIters },
      });
      const id = (res as any).task_id || (res as any).job_id;
      if (!id) throw new Error("Backend did not return a job/task ID");
      return id;
    },
    onSuccess: (newId) => {
      setId(newId);
      const next = new URLSearchParams(search);
      next.set("job", newId);
      next.set("top", topModule);
      setSearch(next, { replace: true });
      qc.invalidateQueries({ queryKey: ["status", newId] });
    },
    onError: (e: any) => alert(e?.message ?? "Failed to start job"),
  });

  // ---------- poll status every 2s until terminal ----------
  const { data: status } = useQuery({
    queryKey: ["status", id],
    queryFn: () => getOptimizationStatus(id as string),
    enabled: !!id,
    refetchInterval: (q) => {
      const st = (q.state.data as any)?.state;
      return isTerminal(st) ? false : 2000;
    },
  });

  // ---------- progress ----------
  const progress = useMemo(() => {
    const s = status?.state?.toLowerCase?.();
    if (s === "queued") return 10;
    if (s === "running" || s === "started") return 50;
    if (isTerminal(s)) return 100;
    return id ? 20 : 0;
  }, [status?.state, id]);

  // ---------- derived outputs & metrics (for old UI cards) ----------
  const optimizedRtl: string = status?.best_result?.candidate_rtl
    ?? status?.candidate_rtl
    ?? "";

  const metrics: MetricCards = {
    powerPct: status?.best_result?.metrics?.power_savings_pct
      ?? status?.metrics?.power_savings_pct
      ?? null,
    timingPct: status?.best_result?.metrics?.timing_improvement_pct
      ?? status?.metrics?.timing_improvement_pct
      ?? null,
    gates: status?.best_result?.metrics?.area_eq_gates
      ?? status?.metrics?.area_eq_gates
      ?? null,
  };

  // ---------- actions ----------
  async function onStop() {
    if (!id) return;
    try {
      await stopOptimization(id);
      qc.invalidateQueries({ queryKey: ["status", id] });
    } catch (e: any) {
      alert(e?.message ?? "Failed to stop job");
    }
  }

  function onReset() {
    setId(null);
    const next = new URLSearchParams(search);
    next.delete("job");
    setSearch(next, { replace: true });
  }

  function onExport() {
    const text = optimizedRtl || "// No optimized RTL yet";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const name = `${topModule || "module"}_optimized.v`;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  // keep top in URL
  useEffect(() => {
    const next = new URLSearchParams(search);
    next.set("top", topModule);
    setSearch(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topModule]);

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      {/* Top bar (small auth controls) */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">VeriRL Optimizer</h1>
        <div className="flex items-center gap-2">
          {!loading && !!user && <Badge variant="secondary">Signed in</Badge>}
          {!loading && !user && REQUIRE_AUTH && (
            <Button
              size="sm"
              onClick={() => {
                const email = prompt("Email for magic-link sign-in:");
                if (email) (signIn as any)(email);
              }}
            >
              Sign in
            </Button>
          )}
          {!loading && !!user && (
            <Button size="sm" variant="outline" onClick={() => (signOut as any)()}>
              Sign out
            </Button>
          )}
        </div>
      </div>

      {/* ===== Row: Input Verilog | Optimized Output ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Input Verilog */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Input Verilog</CardTitle>
            {/* optional filename hint */}
            <span className="text-xs text-muted-foreground">{topModule ? `${topModule}.v` : "module.v"}</span>
          </CardHeader>
          <CardContent>
            <Textarea
              className="h-[420px] font-mono text-xs"
              value={rtl}
              onChange={(e) => setRtl(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Right: Optimized Output */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Optimized Output</CardTitle>
            <Button variant="outline" size="sm" onClick={onExport}>Export</Button>
          </CardHeader>
          <CardContent>
            <Textarea
              className="h-[420px] font-mono text-xs"
              value={optimizedRtl}
              readOnly
            />
          </CardContent>
        </Card>
      </div>

      {/* ===== Targets + Metric Cards ===== */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Targets (left bottom) */}
        <Card>
          <CardHeader>
            <CardTitle>Optimization Targets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                id="t-power"
                type="checkbox"
                className="h-4 w-4"
                checked={tPower}
                onChange={(e) => setTPower(e.target.checked)}
              />
              <Label htmlFor="t-power">Power Reduction</Label>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="t-timing"
                type="checkbox"
                className="h-4 w-4"
                checked={tTiming}
                onChange={(e) => setTTiming(e.target.checked)}
              />
              <Label htmlFor="t-timing">Timing Optimization</Label>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="t-area"
                type="checkbox"
                className="h-4 w-4"
                checked={tArea}
                onChange={(e) => setTArea(e.target.checked)}
              />
              <Label htmlFor="t-area">Area Minimization</Label>
            </div>

            {/* numeric knobs preserved (hidden in old UI, but we keep them editable) */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <Label className="text-xs">Max area</Label>
                <Input
                  type="number"
                  value={targets.max_area ?? ""}
                  onChange={(e) => setTargets((t) => ({ ...t, max_area: +e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Min fmax (MHz)</Label>
                <Input
                  type="number"
                  value={targets.min_fmax_mhz ?? ""}
                  onChange={(e) => setTargets((t) => ({ ...t, min_fmax_mhz: +e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Max power (mW)</Label>
                <Input
                  type="number"
                  value={targets.max_power_mw ?? ""}
                  onChange={(e) => setTargets((t) => ({ ...t, max_power_mw: +e.target.value }))}
                />
              </div>
            </div>
            <div className="w-32">
              <Label className="text-xs">Max iters</Label>
              <Input type="number" value={maxIters} onChange={(e) => setMaxIters(+e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Metric mini-cards (right bottom) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Power Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {metrics.powerPct != null ? `${metrics.powerPct > 0 ? "-" : ""}${Math.abs(metrics.powerPct)}%` : "—"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Timing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {metrics.timingPct != null ? `${metrics.timingPct >= 0 ? "+" : ""}${metrics.timingPct}%` : "—"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Gate Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{metrics.gates ?? "—"}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== Footer controls (Run / Stop / Reset) + live status bar ===== */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Button onClick={() => startMut.mutate()} disabled={startMut.isPending || !canRun}>
            {canRun ? "Run Optimization" : "Sign in to run"}
          </Button>
          {id && (
            <Button variant="outline" onClick={onStop}>
              Stop
            </Button>
          )}
          <Button variant="secondary" onClick={onReset}>
            Reset
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm font-semibold">Status:</span>
            <Badge variant="destructive">{status?.state ?? (id ? "…" : "idle")}</Badge>
          </div>
        </div>

        <Progress value={progress} />
        <Card>
          <CardContent className="pt-4">
            <pre className="bg-muted p-3 rounded text-xs overflow-auto whitespace-pre-wrap">
              {JSON.stringify(status ?? (id ? { id } : { hint: "Click Run Optimization" }), null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
