import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-8 py-16">
      <div className="max-w-[1200px] w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background-secondary border border-border text-sm text-text-secondary mb-4">
          <Zap className="w-4 h-4 text-primary" />
          <span>AI-Powered Verilog Optimization</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold leading-[1.2] tracking-tighter text-foreground">
          Optimize Your Hardware Designs
          <span className="block mt-2 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            With Intelligent AI
          </span>
        </h1>
        
        <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
          VeriRL uses reinforcement learning to automatically optimize your Verilog code,
          reducing power consumption by up to 40% while improving timing and performance.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/optimizer">
            <Button 
              size="lg" 
              className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-glow hover:shadow-glow-lg transition-all"
            >
              Start Optimizing
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link to="/docs">
            <Button 
              size="lg" 
              variant="outline"
              className="h-12 px-6 border-border hover:bg-background-secondary hover:border-primary/50 transition-all"
            >
              View Documentation
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
