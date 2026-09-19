"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Navigation,
  ShieldAlert,
  Zap,
  Truck,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export function EvaluationGuide() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Close guide when navigating to a new page
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (isDismissed) return null;

  const STEPS = [
    {
      step: "01",
      title: "Pan-India Control Tower",
      subtitle: "20 Strategic Hubs · Live Telemetry",
      desc: "Observe real National Highway routes, truck fleet capacities, and active anomaly cards.",
      href: "/control-tower",
      icon: Navigation,
      color: "text-accent",
      badge: "20 Hubs",
    },
    {
      step: "02",
      title: "Judge Simulation Studio",
      subtitle: "Inject Routing Anomalies",
      desc: "Simulate misplaced cargo, cross-dock sorting failures, or linehaul cancellations in real time.",
      href: "/judge",
      icon: ShieldAlert,
      color: "text-amber-400",
      badge: "Simulation",
    },
    {
      step: "03",
      title: "MOSAIC Recovery Engine",
      subtitle: "7-Dimension Constraint Solver",
      desc: "Inspect candidate generation, capacity, SLA deadlines, route detours, and cost-benefit rankings.",
      href: "/staff/recovery/SHP-2048",
      icon: Zap,
      color: "text-purple-400",
      badge: "Optimizer",
    },
    {
      step: "04",
      title: "Live Shipment Tracking",
      subtitle: "Moving Delivery Truck on Map",
      desc: "Watch the animated delivery truck drive live along the turn-by-turn road route with telemetry.",
      href: "/track?id=SHP-2048",
      icon: Truck,
      color: "text-emerald-400",
      badge: "Live Animation",
    },
    {
      step: "05",
      title: "Proof of Recovery & ESG Trace",
      subtitle: "Zero-Carbon Audit Trail",
      desc: "Inspect cryptographic proof, verified SLA adherence, and 420 kg CO₂ avoided certification.",
      href: "/staff/trace/SHP-2048",
      icon: ShieldCheck,
      color: "text-blue-400",
      badge: "ESG Certified",
    },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-40 font-sans">
      {!isOpen ? (
        // Minimized floating pill button
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-surface/95 border border-accent/40 shadow-2xl hover:border-accent text-foreground transition-all hover:scale-105 active:scale-95 backdrop-blur-md"
        >
          <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <Compass className="w-4 h-4 text-accent group-hover:rotate-45 transition-transform" />
          <span className="text-xs font-bold font-mono tracking-tight">
            Jury &amp; Evaluator Tour
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent/15 text-accent font-bold">
            SH-205
          </span>
        </button>
      ) : (
        // Expanded Interactive Guide Modal
        <div className="w-[360px] sm:w-[420px] bg-surface/95 border border-border/90 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
                <Compass className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <span>SH-205 Evaluation Tour</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-500 font-bold">
                    Fast Nav
                  </span>
                </h3>
                <p className="text-[11px] text-muted">
                  Explore the full problem solution step-by-step
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-background text-muted hover:text-foreground transition-colors"
                title="Minimize Guide"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1.5 rounded-xl hover:bg-background text-muted hover:text-foreground transition-colors"
                title="Dismiss for Session"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Step-by-Step Interactive Workflow List */}
          <div
            className="p-3 sm:p-4 space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar"
            data-lenis-prevent="true"
          >
            {STEPS.map((item) => {
              const isCurrent = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block p-3 rounded-2xl border transition-all ${
                    isCurrent
                      ? "bg-accent/10 border-accent/50 shadow-xs"
                      : "bg-background/60 border-border/70 hover:border-accent/40 hover:bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-muted">
                        {item.step}
                      </span>
                      <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
                        <span>{item.title}</span>
                      </h4>
                    </div>
                    <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-surface border border-border text-muted">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed pl-5">
                    {item.desc}
                  </p>
                  <div className="flex items-center justify-between pt-2 pl-5 mt-1 border-t border-border/40 text-[10px] font-mono">
                    <span className="text-muted">{item.subtitle}</span>
                    <span className="text-accent font-semibold flex items-center gap-0.5">
                      Open <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Action Footer */}
          <div className="p-3 bg-surface border-t border-border/80 flex items-center justify-between text-xs">
            <span className="text-[10px] font-mono text-muted">
              Built for VNR Hackathon SH-205
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-mono font-semibold text-muted hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
