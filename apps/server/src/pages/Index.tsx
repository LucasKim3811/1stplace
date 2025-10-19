import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import Footer from "@/components/Footer";
import { startOptimization, getOptimizationStatus } from "@/lib/api";

const SAMPLE_VERILOG = `module counter(input clk, input rst, output reg [7:0] count);
  always @(posedge clk or posedge rst) begin
    if (rst) count <= 8'b0;
    else     count <= count + 1;
  end
endmodule`;

const Index = () => {
  const [verilog, setVerilog] = useState(SAMPLE_VERILOG);
  const [jobId, setJobId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleStart() {
    try {
      setBusy(true);
      setError("");
      setStatus("Submitting...");
      const res = await startOptimization({
        top_module: "counter",
        original_verilog: verilog,
        targets: { frequency_mhz: 500, max_power_mw: 80, max_area: 3000 },
        budgets: { max_iters: 3, max_parallel: 1 },
      });
      setJobId(res.job_id);
      setStatus(res.status); // "queued"
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleCheck() {
    if (!jobId) return;
    try {
      setBusy(true);
      setError("");
      const res = await getOptimizationStatus(jobId);
      setStatus(res.job?.state ?? "unknown");
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border bg-card p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Quick Optimization Test</h2>

          <label className="mb-2 block text-sm font-medium">Input Verilog</label>
          <textarea
            className="mb-4 h-48 w-full resize-y rounded-lg border bg-background p-3 font-mono text-sm"
            value={verilog}
            onChange={(e) => setVerilog(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleStart}
              disabled={busy}
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Working..." : "Run Optimization"}
            </button>

            <button
              onClick={handleCheck}
              disabled={!jobId || busy}
              className="rounded-lg border px-4 py-2 hover:bg-accent disabled:opacity-60"
            >
              Check Status
            </button>

            {jobId && (
              <span className="text-sm text-muted-foreground">
                Job ID: <code className="font-mono">{jobId}</code>
              </span>
            )}
          </div>

          <div className="mt-4 space-y-1 text-sm">
            {status && (
              <div>
                <span className="font-medium">Status:</span> {status}
              </div>
            )}
            {error && <div className="text-destructive">Error: {error}</div>}
          </div>
        </div>
      </div>
      <FeaturesGrid />
      <Footer />
    </div>
  );
};

export default Index;
