"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { stateManager } from "@/lib/engine/state-manager";
import { StaffShipment, Truck } from "@/lib/engine/types";
import {
  AlertCircle,
  CheckCircle2,
  Navigation,
  Package,
  Route,
  ShieldAlert,
  ShieldCheck,
  Truck as TruckIcon,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<StaffShipment[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [solvingId, setSolvingId] = useState<string | null>(null);

  const loadData = () => {
    setShipments(stateManager.getShipments());
    setTrucks(stateManager.getTrucks());
  };

  useEffect(() => {
    loadData();
    const unsub = stateManager.subscribe(loadData);
    return unsub;
  }, []);

  const active = shipments.filter((s) => s.status === "In Transit" || s.status === "Assigned").length;
  const recovered = shipments.filter((s) => s.status === "Recovered" || s.status === "Recovery Found").length;
  const pending = shipments.filter(
    (s) => s.status === "Misplaced" || s.status === "Pending" || s.status === "Delayed"
  ).length;
  const availableTrucks = trucks.filter((t) => t.status === "Available").length;

  const recoveryQueue = shipments.filter(
    (s) => s.status === "Misplaced" || s.status === "Pending" || s.status === "Delayed"
  );

  const handleQuickSolve = (id: string) => {
    setSolvingId(id);
    setTimeout(() => {
      try {
        stateManager.solveRecovery(id);
        router.push(`/staff/recovery/${id}`);
      } catch (e) {
        console.error(e);
        setSolvingId(null);
      }
    }, 400);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Operations Overview</h1>
          <p className="text-sm text-muted mt-1">MOSAIC Intelligent Dynamic Piggybacking Control</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/control-tower"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-surface border border-border hover:border-accent transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 text-accent" /> Control Tower Map
          </Link>
          <Link
            href="/judge"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Judge Mode
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {[
          { label: "Active Shipments", value: active, icon: Package, color: "text-accent" },
          { label: "Recovered Cargo", value: recovered, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Pending Recovery", value: pending, icon: AlertCircle, color: "text-rose-400" },
          { label: "Available Trucks", value: availableTrucks, icon: TruckIcon, color: "text-foreground" },
          { label: "Active Corridors", value: 7, icon: Route, color: "text-accent" },
        ].map((stat, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} strokeWidth={1.5} />
              <span className="font-mono text-[10px] text-muted tracking-wider uppercase">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Live Recovery Queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">Live Recovery Queue</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-bold">
              {recoveryQueue.length} REQUIRES ACTION
            </span>
          </div>
          <span className="text-xs text-muted">CP-SAT Mathematical Recovery Enabled</span>
        </div>

        {recoveryQueue.length === 0 ? (
          <div className="bg-surface border border-border rounded-3xl p-10 text-center shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">No shipments waiting for recovery.</p>
            <p className="text-sm text-muted">All active shipments are adhering to scheduled transit corridors.</p>
            <Link
              href="/judge"
              className="mt-4 inline-block px-4 py-2 rounded-xl text-xs font-semibold bg-surface border border-border hover:border-accent text-accent transition-colors"
            >
              Simulate Disruption in Judge Mode →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recoveryQueue.map((s) => (
              <div
                key={s.id}
                className="bg-surface border border-rose-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md hover:border-rose-500/60 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-rose-500/20">
                    <Package className="w-6 h-6 text-rose-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-bold text-foreground">{s.id}</p>
                      <span className="text-xs font-mono text-muted">({s.code})</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      Intended: {s.origin} → {s.destination} · <span className="text-rose-400">Stranded at {s.currentLocation}</span>
                    </p>
                    {s.disruptionReason && (
                      <p className="text-[11px] text-muted/70 mt-1 italic">{s.disruptionReason}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase">
                    {s.status}
                  </span>

                  <Link
                    href={`/staff/incident/${s.id}`}
                    className="px-3 py-2 rounded-xl text-xs font-medium border border-border hover:bg-background transition-colors"
                  >
                    Inspect
                  </Link>

                  <button
                    onClick={() => handleQuickSolve(s.id)}
                    disabled={solvingId === s.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-accent text-white hover:bg-accent/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {solvingId === s.id ? "Solving..." : "Solve with MOSAIC"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
