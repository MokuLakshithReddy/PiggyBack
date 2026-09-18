"use client";

import { useRef, useLayoutEffect, useState } from "react";
import { playStoryAnimation } from "@/components/animation/story-scene";
import { IndianRupee, Clock, Leaf, CheckCircle2, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import { recoveryOptions } from "@/data/demo";

export function StorySequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardState, setCardState] = useState<"idle" | "searching" | "found">("idle");
  const [selectedRouteId, setSelectedRouteId] = useState<string>("RT-01");

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = playStoryAnimation(containerRef.current);
    return () => ctx.revert();
  }, []);

  const handleStartSearch = () => {
    setCardState("searching");
    setTimeout(() => {
      setCardState("found");
    }, 600);
  };

  const handleScrollToDemo = () => {
    const target = document.getElementById("recovery-demo") || document.getElementById("idea");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("piggyback:start-demo"));
      }
    }
  };

  const currentOption = recoveryOptions.find(o => o.routeId === selectedRouteId) || recoveryOptions[0];

  return (
    <section ref={containerRef} id="story-sequence" className="relative h-[200vh] bg-background w-full">
      <div className="sticky top-0 w-full h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
        
        {/* Step 1: That means... */}
        <div data-story="1" className="absolute inset-0 flex flex-col items-center justify-center px-4 z-10 bg-background">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-foreground mb-12 text-center">
            That means...
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
            <div className="flex flex-col items-center text-center p-6 md:p-8 bg-surface rounded-[2rem] border border-border">
              <IndianRupee className="w-10 h-10 md:w-12 md:h-12 text-accent mb-4 md:mb-6" strokeWidth={1.5} />
              <p className="text-lg md:text-xl font-medium text-foreground">Extra Cost</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 md:p-8 bg-surface rounded-[2rem] border border-border">
              <Clock className="w-10 h-10 md:w-12 md:h-12 text-accent mb-4 md:mb-6" strokeWidth={1.5} />
              <p className="text-lg md:text-xl font-medium text-foreground">Extra Time</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 md:p-8 bg-surface rounded-[2rem] border border-border">
              <Leaf className="w-10 h-10 md:w-12 md:h-12 text-accent mb-4 md:mb-6" strokeWidth={1.5} />
              <p className="text-lg md:text-xl font-medium text-foreground">Wasted Resources</p>
            </div>
          </div>
        </div>

        {/* Step 2: Misplaced Shipment Details & Route Evaluation */}
        <div data-story="2" className="absolute inset-0 flex flex-col items-center justify-center px-4 z-20 bg-background opacity-0">
          <div className="w-full max-w-xl bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
            
            {cardState === "idle" && (
              <>
                <h3 className="font-mono text-sm tracking-widest text-muted mb-8 uppercase">Misplaced Shipment Details</h3>
                
                <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                  <div>
                    <p className="text-xs text-muted mb-1 uppercase tracking-wider">Shipment ID</p>
                    <p className="font-mono font-medium text-lg">SHP-2048</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1 uppercase tracking-wider">Priority</p>
                    <div className="inline-flex items-center px-2 py-1 rounded bg-error/10 text-error text-xs font-bold uppercase tracking-wider">
                      High
                    </div>
                  </div>
                  
                  <div className="col-span-2 flex items-center gap-4 py-4 border-y border-border/50">
                    <div className="flex-1">
                      <p className="text-xs text-muted mb-1 uppercase tracking-wider">From</p>
                      <p className="font-medium text-foreground">Hyderabad</p>
                    </div>
                    <div className="flex-none text-muted">→</div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-muted mb-1 uppercase tracking-wider">To</p>
                      <p className="font-medium text-foreground">Chennai</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted mb-1 uppercase tracking-wider">Weight & Vol</p>
                    <p className="font-medium">42 kg <span className="text-muted mx-1">|</span> 0.8 m³</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1 uppercase tracking-wider">Deadline</p>
                    <p className="font-medium">18 Sep, 20:00</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartSearch}
                  className="w-full py-4 bg-accent text-accent-foreground rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-accent/90 active:scale-[0.99] transition-all cursor-pointer shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30"
                >
                  Find a ride <span className="text-xl leading-none">→</span>
                </button>
              </>
            )}

            {cardState === "searching" && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 border-3 border-border border-t-accent rounded-full animate-spin mb-6" />
                <p className="font-mono text-xs uppercase tracking-widest text-muted mb-2">PIGGYBACK ROUTE ENGINE</p>
                <p className="text-base font-medium text-foreground">Scanning network routes for SHP-2048...</p>
              </div>
            )}

            {cardState === "found" && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-mono text-xs tracking-widest text-foreground font-semibold uppercase">
                      3 Routes Evaluated
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCardState("idle")}
                    className="font-mono text-xs text-muted hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>

                {/* Interactive Route Options Selector */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {recoveryOptions.map(opt => {
                    const isSelected = opt.routeId === selectedRouteId;
                    return (
                      <button
                        key={opt.routeId}
                        type="button"
                        onClick={() => setSelectedRouteId(opt.routeId)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          isSelected
                            ? "bg-accent/10 border-accent text-accent shadow-xs"
                            : "bg-background border-border text-muted hover:text-foreground hover:border-border/80"
                        }`}
                      >
                        <span className="font-bold">{opt.routeId}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          opt.compatible
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-error/10 text-error"
                        }`}>
                          {opt.compatible ? "Match" : "Rejected"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Route Details */}
                <div className="bg-background rounded-2xl p-4 border border-border/80 mb-5">
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface border border-border">
                        {currentOption.routeId} ({currentOption.vehicleId})
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        currentOption.compatible
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-error/10 text-error"
                      }`}>
                        {currentOption.compatible ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Compatible & Optimal
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Rejected
                          </>
                        )}
                      </span>
                    </div>
                    <span className="text-xs text-muted font-mono">
                      {currentOption.compatible ? `Save ₹${currentOption.recoveryCost}` : "No Fit"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                    <div className="bg-surface/50 rounded-lg p-2">
                      <p className="text-[10px] text-muted font-mono">CAPACITY</p>
                      <p className={`font-medium text-xs ${currentOption.availableCapacity < 42 ? "text-error font-bold" : "text-foreground"}`}>
                        {currentOption.availableCapacity} kg
                      </p>
                    </div>
                    <div className="bg-surface/50 rounded-lg p-2">
                      <p className="text-[10px] text-muted font-mono">ADDED KM</p>
                      <p className="font-medium text-xs text-foreground">+{currentOption.additionalDistance} km</p>
                    </div>
                    <div className="bg-surface/50 rounded-lg p-2">
                      <p className="text-[10px] text-muted font-mono">EST COST</p>
                      <p className="font-medium text-xs text-foreground">₹{currentOption.recoveryCost}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted leading-relaxed">
                    {currentOption.explanation}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleScrollToDemo}
                  className="w-full py-3 bg-foreground text-background rounded-xl font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-foreground/90 transition-all cursor-pointer"
                >
                  Open in Interactive Simulation <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Step 3: Dark Cinematic "What if..." */}
        <div data-story="3" className="absolute inset-0 flex flex-col items-center justify-center px-4 z-30 bg-[#0A0A0A] text-white opacity-0 pointer-events-none" style={{ clipPath: "inset(100% 0% 0% 0%)" }}>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight text-center flex flex-col gap-2 max-w-5xl leading-[1.1]">
            <span className="text-white/90">What if it could just join a route</span>
            <span className="text-accent font-semibold">already going there?</span>
          </h2>
        </div>

      </div>
    </section>
  );
}
