"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight, Check, Loader2, ArrowUpRight, RotateCcw } from "lucide-react";
import Link from "next/link";

type Metric = {
  label: string;
  value: string;
};

type PipelineStep = {
  id: string;
  name: string;
  status: string;
  code: string;
  title: string;
  description: string;
  metrics: Metric[];
};

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "detection",
    name: "Shipment Detection",
    status: "STATUS: DETECTED & ISOLATED",
    code: "SHP-2048",
    title: "Misplaced Shipment Identified",
    description: "Automated scan flagged parcel SHP-2048 at Hyderabad Central Hub (Dock 4B). Diverted from canceled transit link with 20:00 IST SLA.",
    metrics: [
      { label: "Origin Location", value: "Hyderabad Central (Dock 4B)" },
      { label: "Final Destination", value: "Chennai Central Depot" },
      { label: "Cargo Dimensions", value: "42 kg | 0.8 m³ (Class A)" },
      { label: "Delivery SLA", value: "Today, 20:00 IST" },
    ],
  },
  {
    id: "route",
    name: "Route Search",
    status: "STATUS: 14 CORRIDORS SCANNED",
    code: "MATCH: RT-884",
    title: "Scheduled Carrier Intercept Found",
    description: "Scan of live fleet schedules matched Line-Haul Carrier #RT-884 traveling HYD → BLR → MAA with intersecting transit window.",
    metrics: [
      { label: "Matched Carrier", value: "Express Line #RT-884" },
      { label: "Current Heading", value: "Hyderabad outbound (68 km/h)" },
      { label: "Interchange Hub", value: "Vijayawada Transfer Bay 3" },
      { label: "Detour Penalty", value: "0.0 km (Direct Transit Corridor)" },
    ],
  },
  {
    id: "capacity",
    name: "Capacity Check",
    status: "STATUS: 38% MARGIN CONFIRMED",
    code: "PAYLOAD: PASS",
    title: "Payload & Weight Clearance",
    description: "Carrier #RT-884 telemetry confirms 180 kg available payload and 2.4 m³ volumetric headspace. Package requires only 42 kg.",
    metrics: [
      { label: "Vehicle Gross Rating", value: "650 kg max" },
      { label: "Active Manifest Load", value: "470 kg (72.3%)" },
      { label: "Available Buffer", value: "180 kg (27.7%)" },
      { label: "Remaining After Match", value: "138 kg (21.2%)" },
    ],
  },
  {
    id: "hub",
    name: "Hub Compatibility",
    status: "STATUS: DOCK RESERVED",
    code: "BAY #03 READY",
    title: "Interchange Hub Alignment",
    description: "Automated bay slot booked at Vijayawada Transfer Hub. Robotic sorting sequence scheduled with zero carrier idle delay.",
    metrics: [
      { label: "Interchange Facility", value: "Vijayawada Central Hub" },
      { label: "Transfer Window", value: "14:20 – 14:35 IST (15 min)" },
      { label: "Handling Protocol", value: "Automated Roller Conveyor" },
      { label: "Carrier Dwell Impact", value: "Zero (Scheduled Stop)" },
    ],
  },
  {
    id: "deadline",
    name: "Deadline Check",
    status: "STATUS: SLA COMPLIANT",
    code: "+1h 15m BUFFER",
    title: "On-Time Arrival Guarantee",
    description: "Real-time traffic and weather modeling predicts Chennai arrival at 18:45 IST, delivering 75 minutes ahead of customer SLA.",
    metrics: [
      { label: "Mandatory SLA", value: "18 Sep, 20:00 IST" },
      { label: "Projected Delivery", value: "18 Sep, 18:45 IST" },
      { label: "Safety Margin", value: "1 hour 15 minutes" },
      { label: "Delivery Confidence", value: "99.4% (Clear Corridors)" },
    ],
  },
  {
    id: "cost",
    name: "Cost Optimization",
    status: "STATUS: 85% COST REDUCTION",
    code: "SAVINGS: ₹10,550",
    title: "Zero-Emission Opportunistic Savings",
    description: "Piggybacking utilizes empty payload on an active scheduled transport, avoiding the fuel, emissions, and cost of an emergency dispatch.",
    metrics: [
      { label: "Dedicated Rescue Truck", value: "₹12,400" },
      { label: "Piggyback Transit Fee", value: "₹1,850" },
      { label: "Net Cost Saved", value: "₹10,550 (-85.1%)" },
      { label: "Carbon Avoided", value: "38.4 kg CO₂e" },
    ],
  },
  {
    id: "recommendation",
    name: "Recovery Recommendation",
    status: "STATUS: READY",
    code: "SHP-2048",
    title: "Optimal Route Found",
    description: "The shipment can be successfully piggybacked onto an existing route with a 38% capacity margin and zero schedule penalty.",
    metrics: [
      { label: "Selected Carrier", value: "Line-Haul #RT-884" },
      { label: "Interchange Hub", value: "Vijayawada (Bay 3)" },
      { label: "Destination Depot", value: "Chennai Central (ETA 18:45)" },
      { label: "Recovery Efficiency", value: "98.7% (Optimal Tier 1)" },
    ],
  },
];

export function SystemView() {
  // Default to the final recommendation step (Step 6) matching user view
  const [activeStep, setActiveStep] = useState(6);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);

  const current = PIPELINE_STEPS[activeStep];

  const handleExecute = () => {
    if (executed) return;
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setExecuted(true);
    }, 700);
  };

  const handleReset = () => {
    setExecuted(false);
  };

  return (
    <section className="py-24 md:py-32 bg-background px-5 sm:px-8 md:px-10 lg:px-14 border-b border-border/60">
      <div className="max-w-5xl mx-auto">
        <header className="mb-14">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-foreground">
            The System Pipeline
          </h2>
          <p className="text-lg text-muted mt-3">
            A compact view of the automated evaluation flow.
          </p>
        </header>

        <div className="bg-surface border border-border rounded-3xl p-6 md:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
            
            {/* Pipeline Visual (Interactive Selector List) */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="font-mono text-xs text-muted tracking-widest uppercase">Evaluation Pipeline</p>
                <span className="font-mono text-[11px] text-muted bg-background px-2.5 py-1 rounded-full border border-border">
                  Step {activeStep + 1} of {PIPELINE_STEPS.length}
                </span>
              </div>

              <div className="space-y-3 relative">
                {/* Vertical connecting line */}
                <div className="absolute left-3.5 top-5 bottom-5 w-px bg-border z-0"></div>
                
                {PIPELINE_STEPS.map((step, i) => {
                  const isActive = activeStep === i;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveStep(i)}
                      className={`w-full flex items-center gap-4 relative z-10 text-left transition-all duration-150 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isActive ? "scale-[1.01]" : "hover:translate-x-0.5"
                      }`}
                      aria-selected={isActive}
                      role="tab"
                    >
                      {/* Step Indicator Dot */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? "bg-accent border-2 border-accent text-white shadow-sm ring-4 ring-accent/15"
                          : "bg-background border border-accent/60"
                      }`}>
                        {isActive ? (
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        )}
                      </div>

                      {/* Interactive Step Card */}
                      <div className={`flex-1 border rounded-xl px-4 py-3 flex justify-between items-center transition-all ${
                        isActive
                          ? "bg-surface border-accent shadow-sm ring-1 ring-accent/30 text-foreground"
                          : "bg-background/70 border-border hover:bg-background text-foreground/80 hover:text-foreground"
                      }`}>
                        <span className={`text-sm ${isActive ? "font-semibold text-foreground" : "font-medium"}`}>
                          {step.name}
                        </span>
                        <CheckCircle2 className={`w-4 h-4 transition-colors ${
                          isActive ? "text-accent" : "text-accent/40"
                        }`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic System Output Dashboard */}
            <div className="flex-1 md:border-l md:border-border md:pl-8 lg:pl-10">
              <div className="flex items-center justify-between mb-6">
                <p className="font-mono text-xs text-muted tracking-widest uppercase">System Output</p>
                {executed && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-muted hover:text-foreground inline-flex items-center gap-1 font-mono transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>
              
              <div className="bg-foreground text-background rounded-2xl p-6 sm:p-8 h-full flex flex-col justify-between min-h-[380px] shadow-md relative overflow-hidden">
                <div>
                  {/* Status Bar */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-background/15">
                    <span className={`font-mono text-xs font-bold tracking-wider ${
                      executed ? "text-success" : "text-accent"
                    }`}>
                      {executed ? "STATUS: DISPATCHED & ACTIVE" : current.status}
                    </span>
                    <span className="font-mono text-xs text-background/70 font-semibold">{current.code}</span>
                  </div>
                  
                  {/* Title & Description */}
                  <h4 className="text-2xl font-medium mb-3 tracking-tight text-white">
                    {executed ? "Recovery Successfully Dispatched" : current.title}
                  </h4>
                  <p className="text-sm text-background/80 mb-6 leading-relaxed">
                    {executed
                      ? "Carrier Line-Haul #RT-884 manifest updated. Dock reservation locked at Vijayawada Hub with real-time telematics."
                      : current.description}
                  </p>

                  {/* Real-Time Telematics / Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2.5 mb-8 pt-4 border-t border-background/15">
                    {current.metrics.map((m, idx) => (
                      <div key={idx} className="bg-background/5 rounded-xl p-3 border border-background/10">
                        <p className="text-[10.5px] font-mono text-background/60 uppercase tracking-wider mb-1">
                          {m.label}
                        </p>
                        <p className="font-medium text-xs sm:text-sm text-white truncate">
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Action Area */}
                {executed ? (
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link
                      href="/track?id=SHP-2048"
                      className="flex-1 bg-accent text-white py-3.5 px-4 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors flex justify-center items-center gap-2 shadow-sm text-center"
                    >
                      Track Live Shipment <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleExecute}
                    disabled={isExecuting}
                    className="w-full bg-background text-foreground py-3.5 px-6 rounded-full text-sm font-semibold hover:bg-surface transition-all flex justify-center items-center gap-2 active:scale-[0.99] disabled:opacity-75 shadow-sm"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-accent" />
                        <span>Dispatching Recovery...</span>
                      </>
                    ) : (
                      <>
                        <span>Execute Recovery</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
