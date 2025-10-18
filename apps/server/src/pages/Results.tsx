import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Results = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">VR</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">VeriRL Optimizer</h1>
        </div>
        
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-sm text-text-secondary hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/optimizer" className="text-sm text-text-secondary hover:text-primary transition-colors">
            Optimizer
          </Link>
          <Link to="/results" className="text-sm text-primary font-medium">
            Results
          </Link>
          <Link to="/dashboard" className="text-sm text-text-secondary hover:text-primary transition-colors">
            Dashboard
          </Link>
        </nav>
      </header>

      <div className="max-w-[1400px] mx-auto p-8">
        {/* Back Button */}
        <Link to="/optimizer">
          <Button variant="ghost" className="mb-6 text-text-secondary hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Optimizer
          </Button>
        </Link>

        {/* Header with Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Optimization Results</h1>
            <p className="text-text-secondary">counter_module.v - Completed in 2.4s</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Metrics Cards - Horizontal Row */}
        <div className="flex gap-4 mb-8">
          <div className="w-[280px] bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-text-tertiary mb-1">Power Consumption</p>
                <h3 className="text-3xl font-bold text-success">-32.4%</h3>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-xs text-text-secondary">Reduced from 48.2mW to 32.6mW</p>
          </div>

          <div className="w-[280px] bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-text-tertiary mb-1">Timing Performance</p>
                <h3 className="text-3xl font-bold text-info">+15.2%</h3>
              </div>
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-info" />
              </div>
            </div>
            <p className="text-xs text-text-secondary">Max frequency: 450MHz → 518MHz</p>
          </div>

          <div className="w-[280px] bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-text-tertiary mb-1">Area Efficiency</p>
                <h3 className="text-3xl font-bold text-warning">-8.1%</h3>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-warning" />
              </div>
            </div>
            <p className="text-xs text-text-secondary">Gate count: 156 → 143 gates</p>
          </div>
        </div>

        {/* Code Comparison - Vertical Split */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Code Comparison</h2>
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="bg-background-secondary rounded-t px-4 py-2 border-b border-border">
                <span className="text-sm font-medium text-text-secondary">Original Design</span>
              </div>
              <div className="bg-background rounded-b p-4 h-[400px] overflow-y-auto">
                <pre className="font-mono text-sm text-text-secondary leading-relaxed">
{`module counter (
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
  
endmodule`}
                </pre>
              </div>
            </div>

            <div className="w-px bg-border"></div>

            <div className="flex-1">
              <div className="bg-background-secondary rounded-t px-4 py-2 border-b border-primary/30">
                <span className="text-sm font-medium text-primary">Optimized Design</span>
              </div>
              <div className="bg-background rounded-b p-4 h-[400px] overflow-y-auto">
                <pre className="font-mono text-sm text-foreground leading-relaxed">
{`module counter_opt (
  input clk,
  input rst,
  output reg [7:0] count
);
  
  // Clock gating for power reduction
  wire clk_gated;
  assign clk_gated = clk & ~rst;
  
  always @(posedge clk_gated) begin
    count <= count + 1;
  end
  
  always @(posedge rst) begin
    count <= 8'b0;
  end
  
endmodule`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Power Consumption Over Time</h3>
            <div className="w-full h-[400px] flex items-center justify-center bg-background rounded border border-border">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-text-tertiary text-sm">Power reduction chart visualization</p>
                <p className="text-xs text-text-disabled mt-2">Baseline vs Optimized comparison</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Timing Analysis</h3>
            <div className="w-full h-[400px] flex items-center justify-center bg-background rounded border border-border">
              <div className="text-center">
                <div className="text-6xl mb-4">⚡</div>
                <p className="text-text-tertiary text-sm">Critical path timing breakdown</p>
                <p className="text-xs text-text-disabled mt-2">Before and after optimization</p>
              </div>
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Optimization Insights</h2>
          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-background rounded border-l-4 border-l-primary">
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Clock Gating Applied</h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Implemented selective clock gating on the counter logic to reduce dynamic power consumption 
                  when the reset signal is active. This optimization alone accounts for 24% of the power savings.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-background rounded border-l-4 border-l-secondary">
              <div className="w-8 h-8 rounded bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-secondary font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Reset Logic Optimization</h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Separated reset logic into a dedicated always block, improving synthesis results and 
                  reducing the critical path delay by 180ps.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-background rounded border-l-4 border-l-info">
              <div className="w-8 h-8 rounded bg-info/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-info font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Resource Sharing</h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Identified and eliminated redundant logic gates through advanced synthesis techniques, 
                  reducing area by 8.1% while maintaining functional equivalence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
