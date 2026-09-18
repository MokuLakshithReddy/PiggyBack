"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { stateManager } from "@/lib/engine/state-manager";
import { Hub, StaffShipment, Truck } from "@/lib/engine/types";
import {
  AlertTriangle,
  Clock,
  Navigation,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Sparkles,
  Truck as TruckIcon,
  XCircle,
  Zap,
} from "lucide-react";

export default function JudgeModePage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<StaffShipment[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);

  // Form states
  const [selectedDisruption, setSelectedDisruption] = useState<
    "misroute_shipment" | "delay_vehicle" | "close_hub" | "reduce_capacity"
  >("misroute_shipment");

  const [targetShipmentId, setTargetShipmentId] = useState("SHP-2048");
  const [targetDivertedHub, setTargetDivertedHub] = useState("Nagpur");

  const [targetTruckId, setTargetTruckId] = useState("TRK-001");
  const [delayMinutes, setDelayMinutes] = useState(45);

  const [targetHubId, setTargetHubId] = useState("HUB-HYD");
  const [capacityReduction, setCapacityReduction] = useState(50);

  const [lastEventMsg, setLastEventMsg] = useState<{
    text: string;
    type: "success" | "error";
    shipmentId?: string;
  } | null>(null);

  const [mounted, setMounted] = useState(false);
  const [stateVersion, setStateVersion] = useState<number>(1);

  const refresh = () => {
    setShipments(stateManager.getShipments());
    setTrucks(stateManager.getTrucks());
    setHubs(stateManager.getHubs());
    setStateVersion(stateManager.getVersion());
  };

  useEffect(() => {
    setMounted(true);
    refresh();
    const unsub = stateManager.subscribe(refresh);
    return unsub;
  }, []);

  const handleInject = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedDisruption === "misroute_shipment") {
        const res = stateManager.injectDisruption({
          disruptionType: "misroute_shipment",
          shipmentId: targetShipmentId,
          targetHub: targetDivertedHub,
          reason: `Judge Mode injected cargo misrouting: Diverted to ${targetDivertedHub} Freight Hub`,
        });
        setLastEventMsg({ text: res.message, type: "success", shipmentId: targetShipmentId });
      } else if (selectedDisruption === "delay_vehicle") {
        const res = stateManager.injectDisruption({
          disruptionType: "delay_vehicle",
          vehicleId: targetTruckId,
          delayMinutes: Number(delayMinutes),
        });
        setLastEventMsg({
          text: res.message,
          type: "success",
          shipmentId: res.affectedShipmentIds[0] || targetShipmentId,
        });
      } else if (selectedDisruption === "close_hub") {
        const res = stateManager.injectDisruption({
          disruptionType: "close_hub",
          hubId: targetHubId,
        });
        setLastEventMsg({
          text: res.message,
          type: "success",
          shipmentId: res.affectedShipmentIds[0] || targetShipmentId,
        });
      } else if (selectedDisruption === "reduce_capacity") {
        const res = stateManager.injectDisruption({
          disruptionType: "reduce_capacity",
          vehicleId: targetTruckId,
          capacityReductionPercent: Number(capacityReduction),
        });
        setLastEventMsg({
          text: res.message,
          type: "success",
          shipmentId: res.affectedShipmentIds[0] || targetShipmentId,
        });
      }
    } catch (err: any) {
      setLastEventMsg({ text: err.message || "Failed to inject disruption", type: "error" });
    }
  };

  const handleReset = () => {
    stateManager.resetToDefault();
    setLastEventMsg({ text: "Simulation reset to pristine baseline state.", type: "success" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 flex flex-col gap-6">
        {/* Title / Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
              <ShieldAlert className="w-4 h-4" /> DISRUPTION STRESS TESTING
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Judge Mode / Disruption Console</h1>
            <p className="text-sm text-muted mt-1 max-w-xl">
              Simulate catastrophic logistics anomalies in real time. Test MOSAIC's mathematical CP-SAT solver against unexpected delays, hub downtime, and misrouted cargo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border/80 text-muted hover:text-foreground hover:bg-surface transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset State
            </button>
            <Link
              href="/control-tower"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-foreground text-background hover:bg-accent transition-colors shadow-md"
            >
              <Navigation className="w-3.5 h-3.5" /> View Control Tower →
            </Link>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {lastEventMsg && (
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
              lastEventMsg.type === "success"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{lastEventMsg.text}</p>
                <p className="text-xs text-muted/80 mt-0.5">Updated digital twin version: {stateManager.getVersion()}</p>
              </div>
            </div>

            {lastEventMsg.shipmentId && (
              <button
                onClick={() => {
                  stateManager.solveRecovery(lastEventMsg.shipmentId!);
                  router.push(`/staff/recovery/${lastEventMsg.shipmentId}`);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-accent text-white hover:bg-accent/90 transition-all shrink-0 flex items-center gap-1.5 shadow-md"
              >
                <Zap className="w-3.5 h-3.5" /> Inspect Recovery Plan →
              </button>
            )}
          </div>
        )}

        {/* Disruption Mode Selector Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              id: "misroute_shipment",
              title: "Misroute Shipment",
              desc: "Divert cargo to an unexpected hub node",
              icon: AlertTriangle,
              color: "text-rose-400",
            },
            {
              id: "delay_vehicle",
              title: "Delay Vehicle",
              desc: "Add transit latency across downstream legs",
              icon: Clock,
              color: "text-amber-400",
            },
            {
              id: "close_hub",
              title: "Emergency Hub Closure",
              desc: "Simulate weather/maintenance hub downtime",
              icon: XCircle,
              color: "text-rose-400",
            },
            {
              id: "reduce_capacity",
              title: "Throttle Capacity",
              desc: "Simulate volume/weight reduction on trucks",
              icon: Sliders,
              color: "text-blue-400",
            },
          ].map((item) => {
            const isSelected = selectedDisruption === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedDisruption(item.id as any)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "bg-surface border-accent ring-1 ring-accent/40 shadow-lg scale-[1.02]"
                    : "bg-surface/50 border-border/70 hover:bg-surface hover:border-border"
                }`}
              >
                <Icon className={`w-5 h-5 ${item.color} mb-2`} />
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="text-xs text-muted mt-1 line-clamp-2">{item.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Injection Form Container */}
        <div className="bg-surface/60 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleInject} className="space-y-6">
            {/* Condition 1: Misroute Shipment */}
            {selectedDisruption === "misroute_shipment" && (
              <div className="space-y-4">
                <div className="border-b border-border/60 pb-3">
                  <h3 className="font-semibold text-base">Misroute Cargo Parameters</h3>
                  <p className="text-xs text-muted mt-0.5">Select the target shipment and the diversion hub.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-muted uppercase tracking-wider block mb-1.5">
                      TARGET SHIPMENT
                    </label>
                    <select
                      value={targetShipmentId}
                      onChange={(e) => setTargetShipmentId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      {shipments.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id} ({s.origin} → {s.destination}) [{s.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-muted uppercase tracking-wider block mb-1.5">
                      DIVERTED HUB LOCATION
                    </label>
                    <select
                      value={targetDivertedHub}
                      onChange={(e) => setTargetDivertedHub(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      {hubs.map((h) => (
                        <option key={h.id} value={h.name}>
                          {h.name} ({h.code}) · {h.state}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Condition 2: Delay Vehicle */}
            {selectedDisruption === "delay_vehicle" && (
              <div className="space-y-4">
                <div className="border-b border-border/60 pb-3">
                  <h3 className="font-semibold text-base">Vehicle Transit Delay Parameters</h3>
                  <p className="text-xs text-muted mt-0.5">Inject schedule latency to test downstream SLA impact.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-muted uppercase tracking-wider block mb-1.5">
                      TARGET VEHICLE
                    </label>
                    <select
                      value={targetTruckId}
                      onChange={(e) => setTargetTruckId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      {trucks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.id} - {t.numberPlate} ({t.currentLocation} → {t.destination})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-muted uppercase tracking-wider block mb-1.5">
                      DELAY DURATION (MINUTES)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="15"
                        max="240"
                        step="15"
                        value={delayMinutes}
                        onChange={(e) => setDelayMinutes(Number(e.target.value))}
                        className="flex-1 accent-accent"
                      />
                      <span className="font-mono text-sm font-bold text-amber-400 w-16 text-right">
                        +{delayMinutes}m
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Condition 3: Emergency Hub Closure */}
            {selectedDisruption === "close_hub" && (
              <div className="space-y-4">
                <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-base">Emergency Hub Downtime & Reopening</h3>
                    <p className="text-xs text-muted mt-0.5">Toggle terminal online/offline status to test dynamic route re-synthesis.</p>
                  </div>
                  {(() => {
                    const selectedHubObj = hubs.find((h) => h.id === targetHubId);
                    const isClosed = selectedHubObj ? !selectedHubObj.isOperational : false;
                    return (
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                          isClosed
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        }`}
                      >
                        {isClosed ? "TERMINAL OFFLINE" : "TERMINAL ONLINE"}
                      </span>
                    );
                  })()}
                </div>

                <div>
                  <label className="text-xs font-mono text-muted uppercase tracking-wider block mb-1.5">
                    SELECT HUB TERMINAL
                  </label>
                  <select
                    value={targetHubId}
                    onChange={(e) => setTargetHubId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {hubs.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} Terminal ({h.code}) — {h.isOperational ? "Active (Online)" : "Closed (Offline)"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Condition 4: Throttle Capacity */}
            {selectedDisruption === "reduce_capacity" && (
              <div className="space-y-4">
                <div className="border-b border-border/60 pb-3">
                  <h3 className="font-semibold text-base">Fleet Payload Constraint Reduction</h3>
                  <p className="text-xs text-muted mt-0.5">Test constraint filtering against oversized/heavy shipments.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-muted uppercase tracking-wider block mb-1.5">
                      TARGET TRUCK
                    </label>
                    <select
                      value={targetTruckId}
                      onChange={(e) => setTargetTruckId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      {trucks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.id} (Cap: {t.capacity}kg / Avail: {t.availableCapacity}kg)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-muted uppercase tracking-wider block mb-1.5">
                      CAPACITY REDUCTION (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="20"
                        max="80"
                        step="10"
                        value={capacityReduction}
                        onChange={(e) => setCapacityReduction(Number(e.target.value))}
                        className="flex-1 accent-accent"
                      />
                      <span className="font-mono text-sm font-bold text-rose-400 w-16 text-right">
                        -{capacityReduction}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between border-t border-border/60">
              <span className="text-xs text-muted">
                State Version:{" "}
                <span className="font-mono font-bold text-foreground" suppressHydrationWarning>
                  {mounted ? stateVersion : 1}
                </span>
              </span>

              <button
                type="submit"
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg active:scale-95 ${
                  selectedDisruption === "close_hub" && hubs.find((h) => h.id === targetHubId && !h.isOperational)
                    ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    : "bg-amber-500 text-black hover:bg-amber-400"
                }`}
              >
                <Zap className="w-4 h-4" />
                {selectedDisruption === "close_hub" && hubs.find((h) => h.id === targetHubId && !h.isOperational)
                  ? "Re-open Terminal & Restore Traffic"
                  : selectedDisruption === "close_hub"
                  ? "Enforce Emergency Hub Closure"
                  : "Inject Disruption Now"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
