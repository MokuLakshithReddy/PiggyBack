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
    setTimeout(() => {
      try {
        stateManager.solveRecovery(shipmentId);
        router.push(`/staff/recovery/${shipmentId}`);
      } catch (e) {
        console.error(e);
        setIsSolving(null);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      {/* Control Tower Sub-Header */}
      <div className="bg-surface/50 border-b border-border/60 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-accent font-mono text-sm font-semibold tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            CONTROL TOWER // REAL GEOGRAPHIC DIGITAL TWIN
          </div>
          <span className="text-xs text-muted border-l border-border/80 pl-3 hidden md:inline">
            Active Nodes: {hubs.length} Hubs · {trucks.length} Fleet Trucks · {shipments.length} Monitored Consignments
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/judge"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Inject Disruption (Judge Mode)
          </Link>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg border border-border/70 hover:bg-surface text-muted hover:text-foreground transition-colors"
            title="Refresh state"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left / Center Map Canvas */}
        <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col relative border-b lg:border-b-0 lg:border-r border-border/60 bg-gradient-to-b from-background to-surface/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold tracking-tight">
                Live Geospatial Network Map (Leaflet / OpenStreetMap / CartoDB)
              </h2>
            </div>
            <div className="text-xs font-mono text-muted">
              Interactive Map · Pan & Zoom Enabled
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
            />
          </div>

          {/* Selected Hub Floating Drawer */}
          {selectedHub && (
            <div className="mt-4 bg-surface/90 border border-border rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
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
        <div className="lg:col-span-4 p-4 sm:p-6 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-120px)]">
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
                      <Link
                        href={`/staff/incident/${s.id}`}
                        className="text-xs text-muted hover:text-foreground transition-colors font-medium"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => handleQuickSolve(s.id)}
                        disabled={isSolving === s.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-accent text-white hover:bg-accent/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {isSolving === s.id ? "Solving CP-SAT..." : "Solve with MOSAIC"}
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
