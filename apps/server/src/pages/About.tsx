import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Github, Mail, Award, Users, Target, Sparkles } from "lucide-react";

const About = () => {
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
          <Link to="/docs" className="text-sm text-text-secondary hover:text-primary transition-colors">
            Docs
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-8 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background-secondary border border-border text-sm text-text-secondary mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>About VeriRL</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            AI-Powered Hardware
            <span className="block mt-2 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Design Optimization
            </span>
          </h1>
          
          <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            VeriRL Optimizer combines cutting-edge reinforcement learning with decades of hardware 
            design expertise to automatically improve Verilog RTL designs.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Our Mission</h3>
              <p className="text-text-secondary leading-relaxed">
                To democratize hardware optimization by making advanced AI-driven design tools 
                accessible to engineers worldwide, reducing time-to-market and improving chip efficiency.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-8">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-6">
                <Award className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Our Technology</h3>
              <p className="text-text-secondary leading-relaxed">
                Built on state-of-the-art reinforcement learning algorithms trained on millions of 
                hardware designs, VeriRL learns optimal transformations while maintaining functional correctness.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-8">
              <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-info" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Our Community</h3>
              <p className="text-text-secondary leading-relaxed">
                Trusted by hardware engineers at leading semiconductor companies and research institutions, 
                optimizing thousands of designs daily with proven results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-8 bg-background-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-sm text-text-secondary">Designs Optimized</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-success mb-2">-28%</div>
              <div className="text-sm text-text-secondary">Avg Power Savings</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-info mb-2">+17%</div>
              <div className="text-sm text-text-secondary">Avg Performance Gain</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2">500+</div>
              <div className="text-sm text-text-secondary">Enterprise Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-semibold text-foreground mb-6">Our Story</h2>
          <div className="space-y-4 text-text-secondary leading-relaxed">
            <p>
              VeriRL was founded in 2022 by a team of hardware engineers and machine learning researchers 
              who recognized the increasing complexity of modern chip design. Traditional optimization 
              methods, while effective, require extensive manual effort and deep domain expertise.
            </p>
            <p>
              We envisioned a future where AI could augment human designers, automatically exploring 
              vast design spaces and identifying optimizations that might take weeks of manual work. 
              By training our models on diverse hardware architectures and optimization patterns, we've 
              created a system that understands the subtle trade-offs between power, performance, and area.
            </p>
            <p>
              Today, VeriRL Optimizer helps engineers at companies ranging from startups to Fortune 500 
              semiconductor firms achieve better designs faster. Our commitment to formal verification 
              ensures that every optimization maintains functional equivalence, giving designers confidence 
              in automated transformations.
            </p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-8 bg-background-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-foreground mb-4">Our Team</h2>
            <p className="text-text-secondary">
              A diverse team of experts in hardware design, machine learning, and software engineering
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Dr. Sarah Chen", role: "CEO & Co-Founder", specialty: "Hardware Architecture" },
              { name: "Prof. Michael Rodriguez", role: "CTO & Co-Founder", specialty: "Machine Learning" },
              { name: "Alex Kim", role: "VP Engineering", specialty: "Software Systems" },
            ].map((member, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4"></div>
                <h4 className="text-lg font-semibold text-foreground mb-1">{member.name}</h4>
                <p className="text-sm text-text-secondary mb-2">{member.role}</p>
                <p className="text-xs text-text-tertiary">{member.specialty}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-foreground mb-4">Get in Touch</h2>
          <p className="text-text-secondary mb-8">
            Have questions about VeriRL? We'd love to hear from you.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Mail className="w-4 h-4 mr-2" />
              Contact Sales
            </Button>
            <Button variant="outline" className="border-border hover:border-primary/50">
              <Github className="w-4 h-4 mr-2" />
              View on GitHub
            </Button>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-text-tertiary">
              VeriRL Technologies Inc. © 2025. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
