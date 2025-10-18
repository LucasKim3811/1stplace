import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const optimizationHistory = [
    { id: 1, module: "counter_8bit", date: "2025-10-15", power: "-32.4%", timing: "+15.2%", area: "-8.1%", status: "success" },
    { id: 2, module: "alu_32bit", date: "2025-10-14", power: "-18.7%", timing: "+22.1%", area: "-12.3%", status: "success" },
    { id: 3, module: "register_file", date: "2025-10-14", power: "-41.2%", timing: "+8.5%", area: "+2.1%", status: "success" },
    { id: 4, module: "uart_tx", date: "2025-10-13", power: "-25.8%", timing: "+11.3%", area: "-15.7%", status: "success" },
    { id: 5, module: "spi_master", date: "2025-10-12", power: "-14.3%", timing: "+18.9%", area: "-6.4%", status: "success" },
  ];

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
          <Link to="/results" className="text-sm text-text-secondary hover:text-primary transition-colors">
            Results
          </Link>
          <Link to="/dashboard" className="text-sm text-primary font-medium">
            Dashboard
          </Link>
        </nav>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sticky Sidebar - Filters */}
        <aside className="w-[280px] border-r border-border bg-card p-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <h2 className="text-lg font-semibold text-foreground mb-6">Filters</h2>
          
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">Date Range</label>
              <select className="w-full h-10 px-3 bg-background border border-border rounded text-sm text-foreground">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>All time</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">Status</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-primary" defaultChecked />
                  <span className="text-sm text-text-secondary">Successful</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-primary" />
                  <span className="text-sm text-text-secondary">Failed</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-primary" />
                  <span className="text-sm text-text-secondary">In Progress</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">Optimization Target</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-primary" defaultChecked />
                  <span className="text-sm text-text-secondary">Power</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-primary" defaultChecked />
                  <span className="text-sm text-text-secondary">Timing</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-primary" defaultChecked />
                  <span className="text-sm text-text-secondary">Area</span>
                </label>
              </div>
            </div>

            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Header with Search */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
              <p className="text-text-secondary">Overview of all optimization runs</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <Input 
                  placeholder="Search modules..." 
                  className="pl-10 w-[280px] bg-background border-border"
                />
              </div>
              <Button variant="outline" className="border-border hover:border-primary/50">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Summary Cards - 12 Column Grid */}
          <div className="grid grid-cols-12 gap-6 mb-8">
            <div className="col-span-3 bg-card border border-border rounded-lg p-6">
              <p className="text-sm text-text-tertiary mb-2">Total Optimizations</p>
              <h3 className="text-3xl font-bold text-foreground">247</h3>
              <p className="text-xs text-success mt-2">+12% from last month</p>
            </div>

            <div className="col-span-3 bg-card border border-border rounded-lg p-6">
              <p className="text-sm text-text-tertiary mb-2">Avg Power Savings</p>
              <h3 className="text-3xl font-bold text-success">-28.3%</h3>
              <p className="text-xs text-text-secondary mt-2">Across all designs</p>
            </div>

            <div className="col-span-3 bg-card border border-border rounded-lg p-6">
              <p className="text-sm text-text-tertiary mb-2">Avg Timing Gain</p>
              <h3 className="text-3xl font-bold text-info">+16.7%</h3>
              <p className="text-xs text-text-secondary mt-2">Performance improvement</p>
            </div>

            <div className="col-span-3 bg-card border border-border rounded-lg p-6">
              <p className="text-sm text-text-tertiary mb-2">Success Rate</p>
              <h3 className="text-3xl font-bold text-foreground">94.2%</h3>
              <p className="text-xs text-text-secondary mt-2">233 of 247 runs</p>
            </div>
          </div>

          {/* Charts - Side by Side, 6 columns each */}
          <div className="grid grid-cols-12 gap-6 mb-8">
            <div className="col-span-6 bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Optimization Trends</h3>
              <div className="h-[320px] flex items-center justify-center bg-background rounded border border-border">
                <div className="text-center">
                  <div className="text-5xl mb-3">📈</div>
                  <p className="text-text-tertiary text-sm">Power, Timing, Area over time</p>
                </div>
              </div>
            </div>

            <div className="col-span-6 bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Module Distribution</h3>
              <div className="h-[320px] flex items-center justify-center bg-background rounded border border-border">
                <div className="text-center">
                  <div className="text-5xl mb-3">🥧</div>
                  <p className="text-text-tertiary text-sm">Module types breakdown</p>
                </div>
              </div>
            </div>
          </div>

          {/* Optimization History Table - Full Width */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Recent Optimizations</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Module</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Power</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Timing</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Area</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {optimizationHistory.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className={`${index % 2 === 0 ? 'bg-background' : 'bg-background-secondary/50'} hover:bg-muted/50 transition-colors`}
                    >
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm text-foreground">{item.module}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-text-secondary">{item.date}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-semibold text-success">{item.power}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-semibold text-info">{item.timing}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-semibold text-warning">{item.area}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-success/10 text-success">
                          Success
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Link to="/results">
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
