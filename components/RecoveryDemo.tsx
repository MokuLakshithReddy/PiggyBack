"use client";

import { useState, useEffect } from "react";
import { demoShipment, recoveryOptions } from "@/data/demo";
import { MapPin, AlertCircle, ArrowRight, CheckCircle2, TrendingDown } from "lucide-react";

type DemoState = "idle" | "searching" | "found";

const SEARCH_STEPS = [
  "01 / Scanning routes...",
  "02 / Checking transfer hubs...",
  "03 / Checking vehicle capacity...",
  "04 / Checking deadlines...",
  "05 / Comparing recovery costs...",
  "06 / Recovery opportunity found."
];

export function RecoveryDemo() {
  const [state, setState] = useState<DemoState>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("RT-01");

  const startSearch = () => {
    if (state === "searching") return;
    setState("searching");
    setStepIndex(0);
    setSelectedRouteId("RT-01");
  };

  useEffect(() => {
    const handleStartDemo = () => {
      startSearch();
    };
    window.addEventListener("piggyback:start-demo", handleStartDemo);
    return () => window.removeEventListener("piggyback:start-demo", handleStartDemo);
  }, [state]);

  useEffect(() => {
    if (state === "searching") {
      if (stepIndex < SEARCH_STEPS.length - 1) {
        const timer = setTimeout(() => {
          setStepIndex(prev => prev + 1);
        }, 800); // 800ms per step
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setState("found");
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [state, stepIndex]);

  const currentOption = recoveryOptions.find(o => o.routeId === selectedRouteId) || recoveryOptions[0];

  return (
    <section id="recovery-demo" className="py-16 md:py-32 bg-surface px-5 sm:px-8 md:px-10 lg:px-14 border-y border-border">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 md:mb-16">
          <p className="font-mono text-xs tracking-[0.2em] text-accent mb-2 md:mb-4">INTERACTIVE DEMO</p>
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-foreground">
            Find a recovery route.
          </h2>
        </header>

        <div className="bg-background rounded-3xl p-5 md:p-10 border border-border shadow-sm relative overflow-hidden">
          
          {/* IDLE STATE */}
          <div className={`transition-opacity duration-500 ${state === "idle" ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 pointer-events-none"}`}>
            <h3 className="text-lg md:text-xl font-medium mb-4 md:mb-6">Misplaced Shipment Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-10">
              <div>
                <p className="text-sm text-muted font-mono mb-1">ID</p>
                <p className="font-medium">{demoShipment.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted font-mono mb-1">FROM</p>
                <p className="font-medium flex items-center gap-1"><MapPin className="w-4 h-4 text-muted"/> {demoShipment.currentLocation}</p>
              </div>
              <div>
                <p className="text-sm text-muted font-mono mb-1">TO</p>
                <p className="font-medium flex items-center gap-1"><MapPin className="w-4 h-4 text-accent"/> {demoShipment.destination}</p>
              </div>
              <div>
                <p className="text-sm text-muted font-mono mb-1">PRIORITY</p>
                <p className="font-medium flex items-center gap-1"><AlertCircle className="w-4 h-4 text-accent"/> {demoShipment.priority}</p>
              </div>
              <div>
                <p className="text-sm text-muted font-mono mb-1">WEIGHT</p>
                <p className="font-medium">{demoShipment.weight} kg</p>
              </div>
              <div>
                <p className="text-sm text-muted font-mono mb-1">VOLUME</p>
                <p className="font-medium">{demoShipment.volume} m³</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted font-mono mb-1">DEADLINE</p>
                <p className="font-medium">18 Sep, 20:00 (Demo)</p>
              </div>
            </div>
            <button 
              onClick={startSearch}
              className="bg-foreground text-background px-8 py-4 rounded-full font-medium inline-flex items-center gap-2 hover:bg-muted transition-colors cursor-pointer"
            >
              Find a ride <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* SEARCHING STATE */}
          <div className={`transition-opacity duration-500 flex flex-col items-center justify-center min-h-[300px] ${state === "searching" ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 pointer-events-none"}`}>
            <div className="w-12 h-12 border-4 border-border border-t-accent rounded-full animate-spin mb-8"></div>
            <div className="h-8 overflow-hidden text-center">
              <p 
                key={stepIndex} 
                className="font-mono text-lg text-foreground animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                {SEARCH_STEPS[stepIndex]}
              </p>
            </div>
          </div>

          {/* FOUND STATE */}
          <div className={`transition-opacity duration-700 ${state === "found" ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 pointer-events-none"}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-medium">Recovery Options Evaluated</h3>
                  <p className="text-xs text-muted font-mono mt-0.5">Select a route below to explore Piggyback decision logic</p>
                </div>
              </div>
              <button 
                onClick={() => setState("idle")}
                className="text-xs font-mono uppercase tracking-wider text-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border bg-surface cursor-pointer"
              >
                Reset Demo ↺
              </button>
            </div>

            {/* Interactive Route Selection Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {recoveryOptions.map(opt => {
                const isSelected = opt.routeId === selectedRouteId;
                return (
                  <button
                    key={opt.routeId}
                    type="button"
                    onClick={() => setSelectedRouteId(opt.routeId)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-surface border-accent shadow-sm ring-1 ring-accent/30"
                        : "bg-surface/50 border-border hover:bg-surface hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-sm text-foreground">{opt.routeId}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        opt.compatible
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-error/10 text-error"
                      }`}>
                        {opt.compatible ? "Recommended" : "Rejected"}
                      </span>
                    </div>
                    <p className="text-xs text-muted font-mono">{opt.vehicleId} • {opt.compatible ? "Compatible" : opt.availableCapacity < 42 ? "Low Capacity" : "Late Arrival"}</p>
                  </button>
                );
              })}
            </div>
            
            {/* Detailed Selected Route Card */}
            <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <p className="font-mono text-sm px-3 py-1 bg-accent/10 text-accent rounded-full font-bold tracking-wider">
                    {currentOption.routeId}
                  </p>
                  <div className="flex items-center gap-2 text-lg font-medium">
                    <span>{demoShipment.currentLocation}</span>
                    <ArrowRight className="w-4 h-4 text-muted" />
                    <span>{demoShipment.destination}</span>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  currentOption.compatible
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-error/10 text-error border border-error/20"
                }`}>
                  {currentOption.compatible ? "✓ Fits All Constraints" : currentOption.availableCapacity < 42 ? "✕ Capacity Constraint Violated" : "✕ Deadline Constraint Violated"}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div>
                  <p className="text-xs text-muted font-mono mb-1">AVAILABLE CAPACITY</p>
                  <p className={`font-medium text-lg ${currentOption.availableCapacity < 42 ? "text-error font-bold" : "text-foreground"}`}>
                    {currentOption.availableCapacity} kg
                  </p>
                  <p className="text-[10px] text-muted">Shipment: 42 kg</p>
                </div>
                <div>
                  <p className="text-xs text-muted font-mono mb-1">ADDED DISTANCE</p>
                  <p className="font-medium text-lg text-foreground">+{currentOption.additionalDistance} km</p>
                  <p className="text-[10px] text-muted">Detour requirement</p>
                </div>
                <div>
                  <p className="text-xs text-muted font-mono mb-1">RECOVERY COST</p>
                  <p className="font-medium text-lg text-foreground">₹{currentOption.recoveryCost}</p>
                  <p className="text-[10px] text-muted">vs ₹8,500 dedicated run</p>
                </div>
                <div>
                  <p className="text-xs text-muted font-mono mb-1">EST. ARRIVAL</p>
                  <p className={`font-medium text-lg ${currentOption.routeId === "RT-03" ? "text-error font-bold" : "text-foreground"}`}>
                    {currentOption.routeId === "RT-01" ? "18:40" : currentOption.routeId === "RT-02" ? "17:10" : "22:15"}
                  </p>
                  <p className="text-[10px] text-muted">Deadline: 20:00</p>
                </div>
              </div>

              <div className="bg-background rounded-xl p-5 border border-border flex items-start gap-3">
                <TrendingDown className={`w-5 h-5 shrink-0 mt-0.5 ${currentOption.compatible ? "text-accent" : "text-muted"}`} />
                <div>
                  <p className="text-xs font-mono font-semibold uppercase tracking-wider text-muted mb-1">
                    Piggyback Decision Diagnostic
                  </p>
                  <p className="text-foreground/90 text-sm leading-relaxed">
                    {currentOption.explanation}
                  </p>
                </div>
              </div>
            </div>
            
          </div>

        </div>
      </div>
    </section>
  );
}
