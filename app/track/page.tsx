"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Package, MapPin, ArrowRight, Clock, AlertCircle, ShieldCheck, Zap, Leaf, Smartphone } from "lucide-react";
import { getTrackingResult } from "@/lib/store";
import type { TrackingResult } from "@/types";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { CustomerNotificationModal } from "@/components/CustomerNotificationModal";

function TrackingContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") ?? "";

  const [input, setInput] = useState(initialId);
  const [state, setState] = useState<"idle" | "searching" | "found" | "not-found">("idle");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const doSearch = useCallback((id: string) => {
    if (!id.trim()) return;
    setState("searching");
    setTimeout(() => {
      const r = getTrackingResult(id.trim().toUpperCase());
      if (r) {
        setResult(r);
        setState("found");
      } else {
        setState("not-found");
      }
    }, 400);
  }, []);

  // Auto-search if URL has id
  useEffect(() => {
    if (initialId) doSearch(initialId);
  }, [initialId, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(input);
  };

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 md:py-16">
      <div className="text-center mb-10">
        <p className="font-mono text-xs tracking-[0.2em] text-accent mb-3 uppercase">
          LIVE CARGO INTELLIGENCE
        </p>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
          Track Your Consignment
        </h1>
        <p className="text-muted text-sm sm:text-base">
          Real-time tracking with autonomous MOSAIC disruption detection & piggyback recovery.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-0 max-w-xl mx-auto mb-12 shadow-lg rounded-2xl overflow-hidden">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. SHP-2048, SHP-2051"
            aria-label="Shipment ID"
            className="w-full pl-11 pr-4 py-3.5 bg-surface border border-border text-base text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3.5 bg-foreground text-background font-semibold hover:bg-accent transition-colors shrink-0"
        >
          Track Cargo →
        </button>
      </form>

      {/* Searching state */}
      {state === "searching" && (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="w-10 h-10 border-3 border-border border-t-accent rounded-full animate-spin" />
          <p className="font-mono text-xs text-muted animate-pulse">Querying digital twin nodes...</p>
        </div>
      )}

      {/* Not Found */}
      {state === "not-found" && (
        <div className="text-center py-12 bg-surface/40 rounded-3xl border border-border p-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-500/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-rose-400" />
          </div>
          <h2 className="text-lg font-bold mb-1">Shipment Not Found</h2>
          <p className="text-muted text-xs">
            Try searching for <span className="font-mono font-bold text-foreground">SHP-2048</span> or{" "}
            <span className="font-mono font-bold text-foreground">SHP-2051</span>.
          </p>
        </div>
      )}

      {/* Found */}
      {state === "found" && result && (
        <div className="space-y-6">
          {/* Shipment Overview Card */}
          <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60">
              <div>
                <p className="font-mono text-[10px] text-muted tracking-wider mb-0.5">CONSIGNMENT ID</p>
                <p className="text-2xl font-bold font-mono text-foreground">{result.shipment.id}</p>
                <p className="font-mono text-xs text-muted mt-0.5">{result.shipment.code}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider ${
                  result.shipment.status === "Recovered" || result.shipment.status === "Recovery Found"
                    ? "status-recovered"
                    : result.shipment.status === "Misplaced" || result.shipment.status === "Delayed"
                    ? "status-misplaced"
                    : result.shipment.status === "In Transit" || result.shipment.status === "Assigned"
                    ? "status-transit"
                    : "status-pending"
                }`}
              >
                {result.shipment.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="font-mono text-[10px] text-muted tracking-wider mb-1 uppercase">ORIGIN</p>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted" />
                  {result.shipment.origin}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-muted tracking-wider mb-1 uppercase">DESTINATION</p>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  {result.shipment.destination}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-muted tracking-wider mb-1 uppercase">PRIORITY</p>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  {result.shipment.priority}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-muted tracking-wider mb-1 uppercase">DEADLINE</p>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted" />
                  {new Date(result.shipment.deadline).toLocaleDateString([], { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* Dynamic Recovery Notice */}
            {(result.shipment.status === "Recovery Found" || result.shipment.status === "Recovered") && (
              <div className="mt-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider font-mono">
                        ✓ PIGGYBACK RECOVERY ENGAGED
                      </p>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                        <Leaf className="w-3 h-3 text-emerald-400" /> 420 kg CO₂ Avoided
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      Assigned to scheduled fleet vehicle{" "}
                      <strong className="text-foreground">{result.shipment.assignedTruck || "TRK-003"}</strong>. Expected on-time delivery maintained.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowNotificationModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-500/30"
                    >
                      <Smartphone className="w-3.5 h-3.5" /> Customer Alert
                    </button>
                    <Link
                      href={`/staff/trace/${result.shipment.id}`}
                      className="px-3 py-1.5 rounded-xl bg-surface border border-border text-foreground hover:border-accent text-xs font-semibold flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> View Proof
                    </Link>
                  </div>
                </div>

                {/* ESG Green Corridor Certified Callout */}
                <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between text-[11px] font-mono text-emerald-300/90">
                  <span className="flex items-center gap-1.5">
                    <Leaf className="w-3.5 h-3.5 text-emerald-400" /> Zero Dedicated Empty Haul Carbon Generated
                  </span>
                  <span className="text-muted">Eco-Certified Shared Routing</span>
                </div>
              </div>
            )}

            {result.shipment.status === "Misplaced" && (
              <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-rose-400 font-bold uppercase tracking-wider font-mono">
                    ⚠ ROUTING ANOMALY DETECTED
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Package diverted to <strong className="text-foreground">{result.shipment.currentLocation}</strong>. MOSAIC optimizer is calculating capacity recovery solutions.
                  </p>
                </div>
                <Link
                  href={`/staff/recovery/${result.shipment.id}`}
                  className="px-3 py-1.5 rounded-xl bg-accent text-white hover:bg-accent/90 text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  <Zap className="w-3.5 h-3.5" /> Inspect Solution
                </Link>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 shadow-xl">
            <p className="font-mono text-xs text-muted tracking-wider mb-6 uppercase">
              CARGO CHRONOLOGY TIMELINE
            </p>
            <div className="space-y-0">
              {result.steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        step.active
                          ? "bg-accent ring-4 ring-accent/20"
                          : step.completed
                          ? "bg-foreground"
                          : "bg-border"
                      }`}
                    />
                    {i < result.steps.length - 1 && (
                      <div
                        className={`w-px flex-1 min-h-[2rem] ${
                          step.completed ? "bg-foreground/30" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-6">
                    <p
                      className={`text-sm font-semibold ${
                        step.active
                          ? "text-accent"
                          : step.completed
                          ? "text-foreground"
                          : "text-muted"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted font-mono mt-0.5">{step.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customer Notification Simulator Modal */}
      {result && (
        <CustomerNotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          shipment={result.shipment as any}
        />
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Suspense fallback={<div className="p-10 text-center font-mono text-xs text-muted">Loading tracker...</div>}>
        <TrackingContent />
      </Suspense>
    </main>
  );
}
