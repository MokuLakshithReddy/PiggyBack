"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Hub, RecoveryPlan, StaffShipment, Truck } from "@/lib/engine/types";
import {
  X,
  Route,
  Navigation,
  CheckCircle2,
  Clock,
  Truck as TruckIcon,
  ShieldCheck,
  Zap,
  Leaf,
  Layers,
} from "lucide-react";

// Dynamic RealNetworkMap import
const RealNetworkMap = dynamic(() => import("@/components/map/RealNetworkMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] flex flex-col items-center justify-center bg-slate-950 text-center p-8 text-slate-400 font-mono text-xs">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2" />
      Synthesizing High-Resolution Highway Telemetry...
    </div>
  ),
});

interface RouteInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: RecoveryPlan | null;
  shipment: StaffShipment | null;
  hubs: Hub[];
  trucks: Truck[];
}

export function RouteInspectionModal({
  isOpen,
  onClose,
  plan,
  shipment,
  hubs,
  trucks,
}: RouteInspectionModalProps) {
  if (!isOpen || !plan) return null;

  const isPrimary = plan.strategy === "PRIMARY";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                isPrimary
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
              }`}
            >
              <Route className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Jury Path Inspector: {isPrimary ? "Primary Piggyback" : "Shadow Alternate"}
                </h2>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                    isPrimary
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                  }`}
                >
                  {plan.strategy}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Corridor: <strong className="text-slate-200">{plan.pickupHub}</strong>
                {plan.transferHub && (
                  <span>
                    {" "}➔ <strong className="text-orange-400">{plan.transferHub} (Transfer Hub)</strong>
                  </span>
                )}{" "}
                ➔ <strong className="text-slate-200">{plan.dropoffHub}</strong> · Carrier:{" "}
                <span className="font-mono text-cyan-300">{plan.vehicleId}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Canvas with Isolated Path Highlighting */}
        <div className="flex-1 relative w-full overflow-hidden bg-[#111317]">
          <RealNetworkMap
            hubs={hubs}
            trucks={trucks}
            shipments={shipment ? [shipment] : []}
            selectedHub={null}
            onSelectHub={() => {}}
            highlightedCorridor={{
              from: plan.pickupHub,
              to: plan.transferHub || plan.dropoffHub,
            }}
          />
        </div>

        {/* Footer Metrics Strip for Jury */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center w-full sm:w-auto">
            <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">RECOVERY COST</span>
              <span className="text-sm font-bold text-white">${plan.incrementalCost}</span>
            </div>
            <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">GUARANTEED ETA</span>
              <span className="text-xs font-bold text-slate-100">
                {new Date(plan.eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">SLA BUFFER</span>
              <span className="text-xs font-bold text-emerald-400">
                +{Math.round(plan.slaMarginMinutes / 60)}h On-Time
              </span>
            </div>
            <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">CARBON ESG SAVED</span>
              <span className="text-xs font-bold text-emerald-400">
                -{Math.round(plan.extraDistance * 0.28 || 95)} kg CO₂
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs uppercase tracking-wider hover:bg-accent/90 transition-all shadow-md active:scale-95"
            >
              Confirm &amp; Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
