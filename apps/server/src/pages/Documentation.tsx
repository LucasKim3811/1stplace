import { Book, Code, Zap, Shield, Cpu, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Documentation = () => {
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
          <Link to="/dashboard" className="text-sm text-text-secondary hover:text-primary transition-colors">
            Dashboard
          </Link>
        </nav>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-[280px] border-r border-border bg-card p-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-4">Documentation</h2>
          
          <nav className="space-y-1">
            <a href="#getting-started" className="block px-3 py-2 rounded text-sm font-medium bg-primary/10 text-primary">
              Getting Started
            </a>
            <a href="#installation" className="block px-3 py-2 rounded text-sm text-text-secondary hover:bg-muted hover:text-foreground transition-colors">
              Installation
            </a>
            <a href="#basic-usage" className="block px-3 py-2 rounded text-sm text-text-secondary hover:bg-muted hover:text-foreground transition-colors">
              Basic Usage
            </a>
            <a href="#optimization-targets" className="block px-3 py-2 rounded text-sm text-text-secondary hover:bg-muted hover:text-foreground transition-colors">
              Optimization Targets
            </a>
            <a href="#api-reference" className="block px-3 py-2 rounded text-sm text-text-secondary hover:bg-muted hover:text-foreground transition-colors">
              API Reference
            </a>
            <a href="#examples" className="block px-3 py-2 rounded text-sm text-text-secondary hover:bg-muted hover:text-foreground transition-colors">
              Examples
            </a>
            <a href="#best-practices" className="block px-3 py-2 rounded text-sm text-text-secondary hover:bg-muted hover:text-foreground transition-colors">
              Best Practices
            </a>
          </nav>

          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-4">Resources</h3>
            <div className="space-y-3">
              <a href="#" className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
                <Book className="w-4 h-4" />
                Tutorial Videos
              </a>
              <a href="#" className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
                <Code className="w-4 h-4" />
                Code Examples
              </a>
              <Link to="/about" className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
                <Shield className="w-4 h-4" />
                About VeriRL
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-foreground mb-4 leading-tight">Documentation</h1>
            <p className="text-xl text-text-secondary">
              Learn how to optimize your Verilog hardware designs with VeriRL's AI-powered platform
            </p>
          </div>

          {/* Getting Started */}
          <section id="getting-started" className="mb-16 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-foreground mb-4">Getting Started</h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              VeriRL Optimizer uses advanced reinforcement learning algorithms to automatically improve your 
              Verilog hardware designs. The system analyzes your code and applies intelligent optimizations 
              to reduce power consumption, improve timing, and minimize area.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-card border border-border rounded-lg p-6">
                <Zap className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Fast</h3>
                <p className="text-sm text-text-secondary">Optimize designs in seconds with our high-performance engine</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <Shield className="w-8 h-8 text-secondary mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Safe</h3>
                <p className="text-sm text-text-secondary">Formally verified to maintain functional equivalence</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <Cpu className="w-8 h-8 text-info mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Smart</h3>
                <p className="text-sm text-text-secondary">AI-driven optimizations learn from each design</p>
              </div>
            </div>
          </section>

          {/* Installation */}
          <section id="installation" className="mb-16 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-foreground mb-4">Installation</h2>
            <p className="text-text-secondary mb-4 leading-relaxed">
              Install VeriRL Optimizer using pip or conda:
            </p>
            
            <div className="bg-background-secondary border border-border rounded-lg p-4 mb-4">
              <pre className="font-mono text-sm text-foreground">
                <code>{`# Using pip
pip install verirl-optimizer

# Using conda
conda install -c verirl verirl-optimizer`}</code>
              </pre>
            </div>

            <p className="text-sm text-text-secondary">
              For detailed installation instructions and system requirements, see the{" "}
              <a href="#" className="text-primary hover:underline">installation guide</a>.
            </p>
          </section>

          {/* Basic Usage */}
          <section id="basic-usage" className="mb-16 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-foreground mb-4">Basic Usage</h2>
            <p className="text-text-secondary mb-4 leading-relaxed">
              Here's a simple example of optimizing a Verilog module:
            </p>

            <div className="bg-background-secondary border border-border rounded-lg p-4 mb-6">
              <pre className="font-mono text-sm text-foreground leading-relaxed">
                <code>{`import verirl

# Load your Verilog design
design = verirl.load("counter.v")

# Configure optimization targets
optimizer = verirl.Optimizer(
    targets=["power", "timing"],
    constraint_timing=True
)

# Run optimization
result = optimizer.optimize(design)

# Export optimized design
result.save("counter_opt.v")`}</code>
              </pre>
            </div>

            <Link to="/optimizer">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Try it in the Web Interface
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </section>

          {/* Optimization Targets */}
          <section id="optimization-targets" className="mb-16 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-foreground mb-4">Optimization Targets</h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              VeriRL supports multiple optimization objectives that can be used individually or combined:
            </p>

            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-2">Power Optimization</h4>
                <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                  Reduces dynamic and static power consumption through clock gating, operand isolation, 
                  and voltage scaling techniques.
                </p>
                <div className="bg-background rounded px-3 py-2 inline-block">
                  <code className="font-mono text-xs text-primary">targets=["power"]</code>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-2">Timing Optimization</h4>
                <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                  Improves maximum operating frequency by optimizing critical paths, pipelining, and 
                  logic restructuring.
                </p>
                <div className="bg-background rounded px-3 py-2 inline-block">
                  <code className="font-mono text-xs text-secondary">targets=["timing"]</code>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-2">Area Optimization</h4>
                <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                  Minimizes chip area through resource sharing, logic minimization, and efficient 
                  state machine encoding.
                </p>
                <div className="bg-background rounded px-3 py-2 inline-block">
                  <code className="font-mono text-xs text-info">targets=["area"]</code>
                </div>
              </div>
            </div>
          </section>

          {/* API Reference */}
          <section id="api-reference" className="mb-16 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-foreground mb-4">API Reference</h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Complete API documentation for VeriRL Optimizer classes and methods.
            </p>

            <div className="bg-card border border-border rounded-lg p-6 mb-4">
              <h4 className="font-mono text-lg text-foreground mb-3">Optimizer</h4>
              <p className="text-sm text-text-secondary mb-4">Main optimization engine class.</p>
              
              <div className="space-y-3 text-sm">
                <div>
                  <code className="font-mono text-primary">optimize(design, iterations=100)</code>
                  <p className="text-text-secondary mt-1 ml-4">Runs optimization on the provided design</p>
                </div>
                <div>
                  <code className="font-mono text-primary">set_constraints(timing=None, power=None)</code>
                  <p className="text-text-secondary mt-1 ml-4">Sets optimization constraints</p>
                </div>
                <div>
                  <code className="font-mono text-primary">get_metrics()</code>
                  <p className="text-text-secondary mt-1 ml-4">Returns optimization metrics and statistics</p>
                </div>
              </div>
            </div>
          </section>

          {/* Examples */}
          <section id="examples" className="mb-16 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-foreground mb-4">Examples</h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Real-world examples of VeriRL optimizations:
            </p>

            <div className="space-y-4">
              <a href="#" className="block bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-colors group">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">8-bit Counter Optimization</h4>
                    <p className="text-sm text-text-secondary">Achieve 32% power reduction with clock gating</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-primary transition-colors" />
                </div>
              </a>

              <a href="#" className="block bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-colors group">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">32-bit ALU Performance Tuning</h4>
                    <p className="text-sm text-text-secondary">Improve timing by 22% through pipelining</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-primary transition-colors" />
                </div>
              </a>

              <a href="#" className="block bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-colors group">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">UART Controller Area Reduction</h4>
                    <p className="text-sm text-text-secondary">Minimize gate count by 16% with resource sharing</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-primary transition-colors" />
                </div>
              </a>
            </div>
          </section>

          {/* Best Practices */}
          <section id="best-practices" className="mb-16 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-foreground mb-4">Best Practices</h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Follow these guidelines to get the best results from VeriRL Optimizer:
            </p>

            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs">✓</span>
                </div>
                <div>
                  <span className="text-foreground font-medium">Start with clean, synthesizable RTL</span>
                  <p className="text-sm text-text-secondary mt-1">Ensure your Verilog code is lint-free and follows standard coding practices</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs">✓</span>
                </div>
                <div>
                  <span className="text-foreground font-medium">Define clear optimization goals</span>
                  <p className="text-sm text-text-secondary mt-1">Prioritize targets based on your design requirements (power, timing, or area)</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs">✓</span>
                </div>
                <div>
                  <span className="text-foreground font-medium">Verify optimized designs thoroughly</span>
                  <p className="text-sm text-text-secondary mt-1">Run comprehensive testbenches to confirm functional equivalence</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs">✓</span>
                </div>
                <div>
                  <span className="text-foreground font-medium">Iterate on complex designs</span>
                  <p className="text-sm text-text-secondary mt-1">Large modules may benefit from multiple optimization passes with different parameters</p>
                </div>
              </li>
            </ul>
          </section>

          {/* Footer CTA */}
          <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/20 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-semibold text-foreground mb-3">Ready to optimize your designs?</h3>
            <p className="text-text-secondary mb-6">Start using VeriRL Optimizer today and see immediate improvements</p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/optimizer">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Launch Optimizer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-border hover:border-primary/50">
                View Examples
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Documentation;
