"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Search,
  Package,
  MapPin,
  Clock,
  AlertCircle,
  ShieldCheck,
  Zap,
  Leaf,
  Smartphone,
  Truck as TruckIcon,
  Sparkles,
} from "lucide-react";
import { getTrackingResult, getShipments } from "@/lib/store";
import type { TrackingResult } from "@/types";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { CustomerNotificationModal } from "@/components/CustomerNotificationModal";

// Dynamically import Leaflet Live Tracking Map without SSR
const LiveShipmentTrackingMap = dynamic(
  () => import("@/components/map/LiveShipmentTrackingMap").then((m) => m.LiveShipmentTrackingMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] bg-surface border border-border rounded-3xl flex flex-col items-center justify-center gap-3 font-mono text-xs text-muted animate-pulse">
        <div className="w-10 h-10 border-3 border-border border-t-accent rounded-full animate-spin" />
        <p>Initializing Live Telemetry Corridors & Road Networks...</p>
      </div>
    ),
  }
);

const QUICK_PRESETS = [
  { id: "SHP-2048", label: "HYD ➔ CHN", desc: "Semiconductors", status: "Recovery Engaged" },
  { id: "SHP-2051", label: "DEL ➔ BLR", desc: "Cold-Chain Vaccines", status: "In Transit" },
  { id: "SHP-2056", label: "AMD ➔ KOL", desc: "Industrial Spares", status: "Piggyback Matched" },
  { id: "SHP-2058", label: "COK ➔ DEL", desc: "Medical Hardware", status: "Active Route" },
];

function TrackingContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") ?? "";

  const [input, setInput] = useState(initialId || "SHP-2048");
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
    }, 250);
  }, []);

  // Auto-search initialId or default to SHP-2048 on load
  useEffect(() => {
    const targetId = initialId || "SHP-2048";
    setInput(targetId);
    doSearch(targetId);
  }, [initialId, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(input);
  };

  const handleSelectPreset = (presetId: string) => {
    setInput(presetId);
    doSearch(presetId);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="font-mono text-xs tracking-[0.2em] text-accent mb-2.5 uppercase">
          LIVE CARGO INTELLIGENCE
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
          Track Your Consignment
        </h1>
        <p className="text-muted text-sm sm:text-base max-w-2xl mx-auto">
          Real-time tracking with autonomous MOSAIC disruption detection & piggyback recovery.
        </p>
      </div>

      {/* Search Form */}
      <div className="max-w-xl mx-auto mb-5">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-0 shadow-xl rounded-2xl overflow-hidden border border-border bg-surface"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. SHP-2048, SHP-2051"
              aria-label="Shipment ID"
              className="w-full pl-11 pr-4 py-3.5 bg-transparent text-base text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 bg-foreground text-background font-semibold hover:bg-accent hover:text-white transition-colors shrink-0 font-mono text-sm"
          >
            Track Cargo →
          </button>
        </form>

        {/* Quick Shipment Chips */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap justify-center">
          <span className="text-[11px] font-mono text-muted mr-1">Quick Select:</span>
          {QUICK_PRESETS.map((p) => {
            const isSelected = result?.shipment.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-accent text-white shadow-sm border border-accent font-bold"
                    : "bg-surface/80 border border-border text-muted hover:text-foreground hover:border-accent"
                }`}
              >
                <span>{p.id}</span>
                <span className="text-[10px] opacity-75 hidden sm:inline">({p.label})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Searching state */}
      {state === "searching" && (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-9 h-9 border-3 border-border border-t-accent rounded-full animate-spin" />
          <p className="font-mono text-xs text-muted animate-pulse">Querying digital twin telematics...</p>
        </div>
      )}

      {/* Not Found */}
      {state === "not-found" && (
        <div className="text-center py-12 bg-surface/60 rounded-3xl border border-border p-8 mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-500/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-rose-400" />
          </div>
          <h2 className="text-lg font-bold mb-1">Shipment Not Found</h2>
          <p className="text-muted text-xs mb-4">
            We couldn't locate consignment <strong className="font-mono text-foreground">{input}</strong> in the digital twin.
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => handleSelectPreset("SHP-2048")}
              className="px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-mono font-semibold"
            >
              Load SHP-2048 Demo
            </button>
          </div>
        </div>
      )}

      {/* Found State: Render Live Map with Moving Truck & Details */}
      {result && state !== "searching" && (
        <div className="space-y-8">
          {/* Live Map with Animated Moving Truck */}
          <div>
            <LiveShipmentTrackingMap
              shipment={result.shipment as any}
              routeStops={result.route}
              assignedTruckId={result.shipment.assignedTruck || undefined}
            />
          </div>

          {/* Consignment Overview Card */}
          <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60 flex-wrap gap-3">
              <div>
                <p className="font-mono text-[10px] text-muted tracking-wider mb-0.5">CONSIGNMENT ID</p>
                <p className="text-2xl font-bold font-mono text-foreground">{result.shipment.id}</p>
                <p className="font-mono text-xs text-muted mt-0.5">{result.shipment.code}</p>
              </div>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono tracking-wider shadow-sm ${
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
              <div className="p-3 rounded-2xl bg-background/50 border border-border/50">
                <p className="font-mono text-[10px] text-muted tracking-wider mb-1 uppercase">ORIGIN</p>
                <p className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <MapPin className="w-3.5 h-3.5 text-muted" />
                  {result.shipment.origin}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-background/50 border border-border/50">
                <p className="font-mono text-[10px] text-muted tracking-wider mb-1 uppercase">DESTINATION</p>
                <p className="text-sm font-semibold flex items-center gap-1.5 text-accent">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  {result.shipment.destination}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-background/50 border border-border/50">
                <p className="font-mono text-[10px] text-muted tracking-wider mb-1 uppercase">PRIORITY</p>
                <p className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  {result.shipment.priority}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-background/50 border border-border/50">
                <p className="font-mono text-[10px] text-muted tracking-wider mb-1 uppercase">DEADLINE</p>
                <p className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <Clock className="w-3.5 h-3.5 text-muted" />
                  {new Date(result.shipment.deadline).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
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
                      <strong className="text-foreground">{result.shipment.assignedTruck || "TRK-003"}</strong>.
                      Expected on-time delivery maintained.
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

                <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between text-[11px] font-mono text-emerald-300/90 flex-wrap gap-2">
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
                    Package diverted to <strong className="text-foreground">{result.shipment.currentLocation}</strong>.
                    MOSAIC optimizer has calculated recovery corridors.
                  </p>
                </div>
                <Link
                  href={`/staff/recovery/${result.shipment.id}`}
                  className="px-3 py-1.5 rounded-xl bg-accent text-white hover:bg-accent/90 text-xs font-semibold flex items-center gap-1 shrink-0 shadow"
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
