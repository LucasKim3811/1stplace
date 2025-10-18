import { Cpu, Gauge, Shield } from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "Smart Optimization",
    description: "Advanced reinforcement learning algorithms analyze your Verilog code to identify optimization opportunities across power, timing, and area metrics.",
  },
  {
    icon: Gauge,
    title: "Real-Time Analysis",
    description: "Get instant feedback on design improvements with comprehensive metrics, timing reports, and power consumption analysis in milliseconds.",
  },
  {
    icon: Shield,
    title: "Verified Safety",
    description: "Every optimization is formally verified to maintain functional equivalence, ensuring your design behavior remains unchanged.",
  },
];

const FeaturesGrid = () => {
  return (
    <section className="py-24 px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 rounded-lg bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-glow"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
