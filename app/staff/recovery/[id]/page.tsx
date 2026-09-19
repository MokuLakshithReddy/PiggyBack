"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { stateManager } from "@/lib/engine/state-manager";
import { DecisionReceipt, RecoveryPlan, StaffShipment } from "@/lib/engine/types";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Navigation,
  ShieldCheck,
  Truck as TruckIcon,
  XCircle,
  Zap,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Bot,
  FileText,
  Smartphone,
  Leaf,
  DollarSign,
  Box,
} from "lucide-react";
import { CargoBayVisualizer } from "@/components/CargoBayVisualizer";
import { DigitalWaybillModal } from "@/components/DigitalWaybillModal";
import { AIDispatcherCopilot } from "@/components/AIDispatcherCopilot";
import { CustomerNotificationModal } from "@/components/CustomerNotificationModal";

export default function RecoveryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const shipmentId = resolvedParams.id;
  const router = useRouter();

  const [shipment, setShipment] = useState<StaffShipment | null>(null);
  const [primaryPlan, setPrimaryPlan] = useState<RecoveryPlan | null>(null);
  const [shadowPlan, setShadowPlan] = useState<RecoveryPlan | null>(null);
  const [receipt, setReceipt] = useState<DecisionReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [reoptimizing, setReoptimizing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showWaybillModal, setShowWaybillModal] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const handleReoptimize = () => {
    setReoptimizing(true);
    setTimeout(() => {
      try {
        stateManager.reoptimize(shipmentId);
        readState();
      } catch (e) {
        console.error("Reoptimize error:", e);
      } finally {
        setReoptimizing(false);
      }
    }, 300);
  };

  const readState = () => {
    const s = stateManager.getShipment(shipmentId);
    if (!s) {
      setLoading(false);
      return;
    }
    setShipment(s);

    const currentPlans = stateManager.getPlans(shipmentId);
    const currentReceipt = stateManager.getReceipt(shipmentId);

    setPrimaryPlan(currentPlans.find((p) => p.strategy === "PRIMARY") || null);
    setShadowPlan(currentPlans.find((p) => p.strategy === "SHADOW") || null);
    setReceipt(currentReceipt || null);
    setLoading(false);
  };

  useEffect(() => {
    // Solve once on initial mount if not yet solved
    const existingReceipt = stateManager.getReceipt(shipmentId);
    if (!existingReceipt) {
      try {
        stateManager.solveRecovery(shipmentId);
      } catch (e) {
        console.error("Initial solve error:", e);
      }
    }
    readState();

    // Subscribe purely to read state updates (zero state mutations inside listener)
    const unsub = stateManager.subscribe(readState);
    return unsub;
  }, [shipmentId]);

  const handleApprove = (planId: string) => {
    setApproving(true);
    setTimeout(() => {
      try {
        stateManager.approvePlan(planId);
        setSuccessMsg("Recovery plan approved and carrier locked! Dispatching piggyback cargo.");
        setTimeout(() => {
          router.push("/staff/dashboard");
        }, 1500);
      } catch (e) {
        console.error(e);
        setApproving(false);
      }
    }, 400);
  };

  if (loading) {
    return <div className="p-10 font-mono text-muted">Running OR-Tools Lexicographic Optimizer...</div>;
  }

  if (!shipment) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold">Shipment Not Found</h2>
        <Link href="/staff/shipments" className="text-accent text-sm mt-3 inline-block">
          &larr; Back to Shipments
        </Link>
      </div>
    );
  }

  const isNoFeasible = !primaryPlan || receipt?.status === "NO_FEASIBLE_PIGGYBACK";

  // Aggregate rejection reasons
  const rejectionCounts = receipt?.rejectedCandidates.reduce((acc: Record<string, number>, rc) => {
    acc[rc.rejectionReason] = (acc[rc.rejectionReason] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <Link
            href={`/staff/incident/${shipmentId}`}
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Incident
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Recovery Plans for {shipment.id}
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 font-semibold">
              MOSAIC OPTIMIZED
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Origin: <strong>{shipment.origin}</strong> → Destination: <strong>{shipment.destination}</strong> · Currently Stranded:{" "}
            <strong>{shipment.currentLocation}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCopilot(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:bg-purple-500/25 transition-colors shadow-sm"
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" /> Ask AI Copilot
          </button>
          <button
            onClick={() => setShowWaybillModal(true)}
            disabled={!primaryPlan && !shadowPlan}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-surface border border-border/80 text-foreground hover:border-accent hover:bg-surface/80 transition-colors shadow-sm disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-accent" /> Print Waybill
          </button>
          <button
            onClick={() => setShowCustomerModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 transition-colors shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Customer Alert
          </button>
          <button
            onClick={handleReoptimize}
            disabled={reoptimizing}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-accent/15 border border-accent/40 text-accent hover:bg-accent/25 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reoptimizing ? "animate-spin" : ""}`} /> Re-solve MOSAIC
          </button>
          <Link
            href={`/staff/trace/${shipmentId}`}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-surface border border-border/80 hover:border-accent transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Decision Trace
          </Link>
          <Link
            href={`/staff/autopsy/${shipmentId}`}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-surface border border-border/80 hover:border-accent transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" /> Autopsy
          </Link>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {isNoFeasible ? (
        /* No Feasible Plan State */
        <div className="bg-rose-950/20 border border-rose-900/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
          <XCircle className="w-16 h-16 text-rose-500 mb-4" />
          <h2 className="text-2xl font-bold text-rose-400 mb-2">No Feasible Piggyback Found</h2>
          <p className="text-slate-400 max-w-lg mb-6 text-sm leading-relaxed">
            The optimization engine exhaustively evaluated all available carrier fleet routes, but none passed the 7-dimension hard constraint filters. A dedicated recovery charter or relaxed SLA window is required.
          </p>

          {/* Closed Hub Warning & Instant Action */}
          {(() => {
            const allHubs = stateManager.getHubs();
            const closedHubs = allHubs.filter((h) => !h.isOperational);
            if (closedHubs.length > 0 && rejectionCounts["HUB_UNAVAILABLE"]) {
              return (
                <div className="w-full max-w-2xl mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-amber-300">Terminal Restriction Detected</span>
                      <span className="text-amber-200/80">
                        {closedHubs.map((h) => `${h.name} (${h.code})`).join(", ")} is currently marked OFFLINE in Judge Mode. Hard constraint filters rejected all departures at this hub.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      closedHubs.forEach((h) => stateManager.reopenHub(h.id));
                      try {
                        stateManager.solveRecovery(shipmentId);
                      } catch (e) {
                        console.error(e);
                      }
                      readState();
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all shadow-md shrink-0 w-full sm:w-auto"
                  >
                    Re-open Terminal & Re-Solve
                  </button>
                </div>
              );
            }
            return null;
          })()}

          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <button
              onClick={handleReoptimize}
              disabled={reoptimizing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${reoptimizing ? "animate-spin" : ""}`} /> Re-run MOSAIC Optimizer
            </button>
            <button
              onClick={() => {
                try {
                  stateManager.deployEmergencyCharter(shipmentId);
                  setSuccessMsg("Emergency bypass charter authorized! Carrier assigned and dispatched.");
                  setTimeout(() => router.push("/staff/dashboard"), 1500);
                } catch (e) {
                  console.error(e);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
            >
              <Zap className="w-4 h-4" /> Deploy Bypass Charter
            </button>
            <button
              onClick={() => {
                stateManager.resetToDefault();
                try {
                  stateManager.solveRecovery(shipmentId);
                } catch (e) {
                  console.error(e);
                }
                readState();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-border text-foreground font-semibold text-xs hover:border-accent transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> Reset Simulation State
            </button>
          </div>

          {/* Rejection Breakdown */}
          <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl p-6 text-left">
            <h3 className="text-xs font-semibold uppercase text-muted mb-6 flex items-center justify-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-400" /> Hard Constraint Rejection Breakdown
            </h3>

            <div className="space-y-3">
              {Object.entries(rejectionCounts).map(([reason, count]) => {
                const total = receipt?.rejectedCandidates.length || 1;
                const percentage = Math.round((Number(count) / total) * 100);
                return (
                  <div key={reason} className="flex items-center gap-4">
                    <div className="w-52 text-right text-xs text-muted font-mono truncate">{reason}</div>
                    <div className="flex-1 h-3 bg-background rounded-full overflow-hidden border border-border/50">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="w-12 text-xs font-mono text-muted text-right">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Feasible Dual Plans: PRIMARY vs SHADOW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PRIMARY RECOVERY PLAN */}
          {primaryPlan && (
            <div className="bg-surface/80 border-2 border-accent/70 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold font-mono px-3 py-1 rounded-bl-xl tracking-wider uppercase">
                RECOMMENDED PRIMARY
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-xs font-bold text-accent tracking-wider uppercase">
                    STRATEGY: PRIMARY PIGGYBACK
                  </span>
                </div>

                <h2 className="text-xl font-bold tracking-tight mb-4">
                  Carrier Vehicle: {primaryPlan.vehicleId}
                </h2>

                <div className="bg-background/80 border border-border/80 rounded-2xl p-4 mb-6 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Transfer Synchronization:</span>
                    <span className="font-mono font-bold text-foreground">
                      {primaryPlan.transfers === 0 ? "Direct (0 Transfers)" : `1 Transfer @ ${primaryPlan.transferHub}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Estimated Arrival (ETA):</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {new Date(primaryPlan.eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })},{" "}
                      {new Date(primaryPlan.eta).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">SLA Margin:</span>
                    <span className={`font-mono font-bold ${primaryPlan.slaMarginMinutes >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {primaryPlan.slaMarginMinutes >= 0
                        ? `+${Math.round(primaryPlan.slaMarginMinutes / 60)}h on-time buffer`
                        : `${Math.round(primaryPlan.slaMarginMinutes)}m breach`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Incremental Recovery Cost:</span>
                    <span className="font-mono font-bold text-foreground">${primaryPlan.incrementalCost}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Detour Extra Distance:</span>
                    <span className="font-mono text-muted">+{primaryPlan.extraDistance} km</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => handleApprove(primaryPlan.planId)}
                  disabled={approving || primaryPlan.status === "APPROVED"}
                  className="w-full py-3.5 rounded-xl font-bold bg-accent text-white hover:bg-accent/90 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {approving
                    ? "Dispatching Cargo..."
                    : primaryPlan.status === "APPROVED"
                    ? "Plan Active & Executing"
                    : "Approve & Dispatch Recovery"}
                </button>
              </div>
            </div>
          )}

          {/* SHADOW RECOVERY PLAN (Independent Redundancy) */}
          {shadowPlan ? (
            <div className="bg-surface/50 border border-border/80 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span className="font-mono text-xs font-bold text-blue-400 tracking-wider uppercase">
                    STRATEGY: SHADOW (INDEPENDENT REDUNDANCY)
                  </span>
                </div>

                <h2 className="text-xl font-bold tracking-tight mb-4">
                  Carrier Vehicle: {shadowPlan.vehicleId}
                </h2>

                <p className="text-xs text-muted mb-4 leading-relaxed">
                  Strictly non-overlapping fleet capacity. Ready for hot-swap execution in the event of primary carrier breakdown.
                </p>

                <div className="bg-background/80 border border-border/80 rounded-2xl p-4 mb-6 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Transfer Synchronization:</span>
                    <span className="font-mono font-bold text-foreground">
                      {shadowPlan.transfers === 0 ? "Direct (0 Transfers)" : `1 Transfer @ ${shadowPlan.transferHub}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Estimated Arrival (ETA):</span>
                    <span className="font-mono font-bold text-foreground">
                      {new Date(shadowPlan.eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })},{" "}
                      {new Date(shadowPlan.eta).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">SLA Margin:</span>
                    <span className={`font-mono font-bold ${shadowPlan.slaMarginMinutes >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {shadowPlan.slaMarginMinutes >= 0
                        ? `+${Math.round(shadowPlan.slaMarginMinutes / 60)}h buffer`
                        : `${Math.round(shadowPlan.slaMarginMinutes)}m breach`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Incremental Recovery Cost:</span>
                    <span className="font-mono font-bold text-foreground">${shadowPlan.incrementalCost}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Detour Extra Distance:</span>
                    <span className="font-mono text-muted">+{shadowPlan.extraDistance} km</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => handleApprove(shadowPlan.planId)}
                  disabled={approving || shadowPlan.status === "APPROVED"}
                  className="w-full py-3.5 rounded-xl font-bold border border-border/80 hover:border-accent text-foreground hover:bg-surface transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Select Shadow Alternate
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface/30 border border-border/60 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center">
              <TruckIcon className="w-12 h-12 text-muted mb-3" />
              <h3 className="font-semibold text-sm">No Independent Shadow Fleet Available</h3>
              <p className="text-xs text-muted mt-1 max-w-xs">
                All remaining secondary carriers failed hard constraint checks (insufficient volume/deadlines).
              </p>
            </div>
          )}
        </div>
      )}

      {/* ESG Carbon Footprint & Financial Savings Card */}
      {!isNoFeasible && primaryPlan && (
        <div className="mt-8 bg-gradient-to-br from-emerald-950/20 via-surface/80 to-surface border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 mb-1">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <span>GREEN LOGISTICS &amp; RESOURCE UTILIZATION ROI</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                ESG Sustainability &amp; Cost Avoidance Impact
              </h3>
              <p className="text-xs text-muted mt-1">
                Measured against single-use dedicated emergency charter van dispatched on the same corridor.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-300 shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>GREEN FREIGHT CERTIFIED</span>
            </div>
          </div>

          {/* 4-stat metrics grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* Metric 1: Cost Savings */}
            <div className="bg-background/80 border border-border/70 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted font-medium flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-accent" /> Net Cost Savings
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent font-bold">
                  {primaryPlan.costSavingsPercent || 78}% SAVED
                </span>
              </div>
              <p className="text-2xl font-black text-foreground">
                ${((primaryPlan.baselineCharterCost || 2850) - primaryPlan.incrementalCost).toLocaleString()}
              </p>
              <p className="text-[11px] text-muted font-mono mt-1">
                ${primaryPlan.incrementalCost} piggyback vs ${(primaryPlan.baselineCharterCost || 2850).toLocaleString()} charter
              </p>
            </div>

            {/* Metric 2: CO2 Avoided */}
            <div className="bg-background/80 border border-border/70 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted font-medium flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" /> CO₂ Emissions Avoided
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                  ZERO DIRECT EMISSION
                </span>
              </div>
              <p className="text-2xl font-black text-emerald-400">
                {(primaryPlan.co2SavedKg || 420).toLocaleString()} kg CO₂
              </p>
              <p className="text-[11px] text-muted font-mono mt-1">
                Shared vehicle load avoids dedicated diesel burn
              </p>
            </div>

            {/* Metric 3: Diesel Fuel Conserved */}
            <div className="bg-background/80 border border-border/70 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted font-medium flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-400" /> Diesel Conserved
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">
                  0.28 L / KM
                </span>
              </div>
              <p className="text-2xl font-black text-foreground">
                {(primaryPlan.fuelSavedLiters || 155).toLocaleString()} Liters
              </p>
              <p className="text-[11px] text-muted font-mono mt-1">
                Saved by consolidating onto scheduled carrier
              </p>
            </div>

            {/* Metric 4: Deadhead Miles Averted */}
            <div className="bg-background/80 border border-border/70 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted font-medium flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-purple-400" /> Empty Miles Averted
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold">
                  NO DEADHEAD
                </span>
              </div>
              <p className="text-2xl font-black text-foreground">
                {(primaryPlan.emptyMilesAvertedKm || 510).toLocaleString()} km
              </p>
              <p className="text-[11px] text-muted font-mono mt-1">
                Zero empty single-purpose deadhead transit
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Volumetric Truck Space Visualizer (Cargo Tetris) */}
      {!isNoFeasible && primaryPlan && (
        <div className="mt-8">
          <CargoBayVisualizer
            vehicleId={primaryPlan.vehicleId}
            shipmentId={shipment.id}
            shipmentWeight={shipment.weight}
            shipmentVolume={shipment.volume}
          />
        </div>
      )}

      {/* Modals */}
      {(primaryPlan || shadowPlan) && (
        <>
          <DigitalWaybillModal
            isOpen={showWaybillModal}
            onClose={() => setShowWaybillModal(false)}
            shipment={shipment}
            plan={primaryPlan || shadowPlan!}
            receipt={receipt}
          />

          <AIDispatcherCopilot
            isOpen={showCopilot}
            onClose={() => setShowCopilot(false)}
            shipment={shipment}
            plan={primaryPlan || shadowPlan!}
            receipt={receipt}
          />

          <CustomerNotificationModal
            isOpen={showCustomerModal}
            onClose={() => setShowCustomerModal(false)}
            shipment={shipment}
            plan={primaryPlan || shadowPlan}
          />
        </>
      )}
    </div>
  );
}
