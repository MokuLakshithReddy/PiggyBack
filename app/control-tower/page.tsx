"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { stateManager } from "@/lib/engine/state-manager";
import { Hub, StaffShipment, Truck } from "@/lib/engine/types";
import {
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Package,
  Radio,
  RefreshCw,
  Route,
  ShieldAlert,
  Truck as TruckIcon,
  Zap,
} from "lucide-react";

// Real Geographic Leaflet Map loaded client-side
const RealNetworkMap = dynamic(() => import("@/components/map/RealNetworkMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[550px] flex flex-col items-center justify-center bg-surface/40 rounded-2xl border border-border/80 text-center p-8">
      <div className="w-10 h-10 border-3 border-border border-t-accent rounded-full animate-spin mb-3" />
      <p className="font-mono text-xs text-muted">Loading Real Geographic Map & Satellite Tiles...</p>
      <p className="text-[11px] text-muted/60 mt-1">Connecting to CartoDB / OpenStreetMap Telemetry</p>
    </div>
  ),
});

export default function ControlTowerPage() {
  const router = useRouter();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [shipments, setShipments] = useState<StaffShipment[]>([]);
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [highlightedCorridor, setHighlightedCorridor] = useState<{ from: string; to: string } | null>(null);
  const [isSolving, setIsSolving] = useState<string | null>(null);

  const loadData = () => {
    setHubs(stateManager.getHubs());
    setTrucks(stateManager.getTrucks());
    setShipments(stateManager.getShipments());
  };

  useEffect(() => {
    loadData();
    const unsub = stateManager.subscribe(loadData);
    return unsub;
  }, []);

  // Filter out disrupted shipments
  const disruptedShipments = useMemo(() => {
    return shipments.filter(
      (s) => s.status === "Misplaced" || s.status === "Delayed" || s.status === "Pending"
    );
  }, [shipments]);

  const handleQuickSolve = (shipmentId: string) => {
    setIsSolving(shipmentId);
    try {
      stateManager.solveRecovery(shipmentId);
      router.push(`/staff/recovery/${shipmentId}`);
    } catch (e) {
      console.error("Quick solve error:", e);
      setIsSolving(null);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-background text-foreground selection:bg-accent selection:text-white">
      <Navbar />

      {/* Control Tower Sub-Header */}
      <div className="border-b border-border/80 bg-surface/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md sticky top-16 z-30 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              Pan-India MOSAIC Control Tower
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/25">
                v2.4 Telemetry
              </span>
            </h1>
            <p className="text-xs text-muted">
              Live National Freight Operations · 20 Hub Logistics Grid · GPS High-Frequency Feed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/staff/dashboard")}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium border border-border/80 hover:bg-surface text-foreground transition-colors"
          >
            Incident Dashboard
          </button>
          <button
            onClick={() => {
              loadData();
              setSelectedHub(null);
              setSelectedPathId(null);
            }}
            className="p-2 rounded-xl border border-border/80 hover:bg-surface text-muted hover:text-foreground transition-colors"
            title="Refresh state"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 lg:overflow-hidden min-h-0">
        {/* Left / Center Map Canvas */}
        <div
          className="lg:col-span-8 p-4 sm:p-6 flex flex-col relative border-b lg:border-b-0 lg:border-r border-border/60 bg-gradient-to-b from-background to-surface/20 min-h-0 lg:h-full lg:overflow-y-auto custom-scrollbar"
          data-lenis-prevent="true"
        >
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold tracking-tight">
                Live Geospatial Network Map (20 Hubs · Interactive Jury Path Inspection)
              </h2>
            </div>
            <div className="text-xs font-mono text-muted">
              Click any route to isolate &amp; highlight
            </div>
          </div>

          {/* Real Interactive Map Container */}
          <div className="flex-1 flex flex-col min-h-[520px]">
            <RealNetworkMap
              hubs={hubs}
              trucks={trucks}
              shipments={shipments}
              selectedHub={selectedHub}
              onSelectHub={setSelectedHub}
              onQuickSolve={handleQuickSolve}
              selectedPathId={selectedPathId}
              onSelectPath={(p) => setSelectedPathId(p?.id || null)}
              highlightedCorridor={highlightedCorridor}
            />
          </div>

          {/* Selected Hub Floating Drawer */}
          {selectedHub && (
            <div className="mt-4 bg-surface/90 border border-border rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center font-mono font-bold text-accent text-sm">
                  {selectedHub.code}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-foreground">{selectedHub.name} Terminal</h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        selectedHub.isOperational
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {selectedHub.isOperational ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    {selectedHub.state} Freight Zone · Maintenance: 02:00–04:00 AM · Lat/Lon: {selectedHub.lat}, {selectedHub.lon}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedHub(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-border hover:bg-surface text-muted hover:text-foreground transition-colors"
                >
                  Close Hub Info
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Interventions & Active Incidents */}
        <div
          className="lg:col-span-4 p-4 sm:p-6 flex flex-col gap-6 overflow-y-auto lg:h-[calc(100vh-140px)] overscroll-contain custom-scrollbar min-h-0"
          data-lenis-prevent="true"
        >
          {/* Quick Metrics Header */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface/60 border border-border/80 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-muted">PENDING RECOVERIES</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-bold text-rose-400">{disruptedShipments.length}</p>
            </div>
            <div className="bg-surface/60 border border-border/80 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-muted">AVAILABLE TRUCKS</span>
                <TruckIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">
                {trucks.filter((t) => t.status === "Available").length}
              </p>
            </div>
          </div>

          {/* Active Disruption Queue */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-semibold">Active Disruption Interventions</h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold">
                {disruptedShipments.length} ALERT
              </span>
            </div>

            {disruptedShipments.length === 0 ? (
              <div className="bg-surface/40 border border-border/80 rounded-2xl p-8 text-center flex-1 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
                <p className="text-sm font-medium">All Networks Balanced</p>
                <p className="text-xs text-muted mt-1 max-w-xs">
                  Zero active cargo anomalies. Use Judge Mode to inject simulation events.
                </p>
                <Link
                  href="/judge"
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-foreground text-background hover:bg-accent transition-colors"
                >
                  Inject Test Disruption →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {disruptedShipments.map((s) => (
                  <div
                    key={s.id}
                    className="bg-surface/80 border border-rose-500/30 rounded-2xl p-4 hover:border-rose-500/60 transition-all shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-rose-400" />
                        <span className="font-mono text-xs font-bold text-foreground">{s.id}</span>
                        <span className="text-[10px] font-mono text-muted">({s.code})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        {s.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-muted mb-2">
                      Route: <strong className="text-foreground">{s.origin}</strong> →{" "}
                      <strong className="text-foreground">{s.destination}</strong>
                    </p>

                    <div className="bg-background/80 rounded-xl p-2.5 text-xs text-rose-300 font-mono mb-3 border border-rose-500/20">
                      📍 Stranded at: <strong>{s.currentLocation}</strong>
                      {s.disruptionReason && <div className="text-[10px] text-muted mt-1">{s.disruptionReason}</div>}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/staff/incident/${s.id}`}
                          className="text-xs text-muted hover:text-foreground transition-colors font-medium"
                        >
                          Details
                        </Link>
                        <Link
                          href={`/track?id=${s.id}`}
                          className="text-xs text-muted hover:text-accent transition-colors font-medium flex items-center gap-1"
                          title="View Live Moving Truck Map"
                        >
                          <TruckIcon className="w-3 h-3 text-accent" /> Track
                        </Link>
                        <button
                          onClick={() => {
                            if (
                              highlightedCorridor &&
                              highlightedCorridor.from.toLowerCase() === s.currentLocation.toLowerCase() &&
                              highlightedCorridor.to.toLowerCase() === s.destination.toLowerCase()
                            ) {
                              setHighlightedCorridor(null);
                              setSelectedPathId(null);
                            } else {
                              setHighlightedCorridor({
                                from: s.currentLocation,
                                to: s.destination,
                              });
                            }
                          }}
                          className={`flex items-center gap-1 text-[11px] font-mono transition-all cursor-pointer px-2.5 py-1 rounded-lg border ${
                            highlightedCorridor?.from.toLowerCase() === s.currentLocation.toLowerCase() &&
                            highlightedCorridor?.to.toLowerCase() === s.destination.toLowerCase()
                              ? "bg-accent text-white border-accent font-bold shadow-xs"
                              : "text-accent border-accent/40 bg-accent/5 hover:bg-accent/15"
                          }`}
                          title="Isolate & highlight recovery corridor on map"
                        >
                          <Route className="w-3 h-3" />
                          {highlightedCorridor?.from.toLowerCase() === s.currentLocation.toLowerCase() &&
                          highlightedCorridor?.to.toLowerCase() === s.destination.toLowerCase()
                            ? "Active"
                            : "Highlight"}
                        </button>
                      </div>
                      <button
                        onClick={() => handleQuickSolve(s.id)}
                        disabled={isSolving === s.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-accent text-white hover:bg-accent/90 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Zap className={`w-3.5 h-3.5 ${isSolving === s.id ? "animate-spin" : ""}`} />
                        {isSolving === s.id ? "Solving & Routing..." : "Solve with MOSAIC"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
