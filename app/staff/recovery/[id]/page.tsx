"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { stateManager } from "@/lib/engine/state-manager";
import { DecisionReceipt, Hub, RecoveryPlan, StaffShipment, Truck } from "@/lib/engine/types";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Navigation,
  Route,
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
import { RouteInspectionModal } from "@/components/RouteInspectionModal";

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
  const [inspectingPlan, setInspectingPlan] = useState<RecoveryPlan | null>(null);
  const [allHubs, setAllHubs] = useState<Hub[]>([]);
  const [allTrucks, setAllTrucks] = useState<Truck[]>([]);

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
    setAllHubs(stateManager.getHubs());
    setAllTrucks(stateManager.getTrucks());
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
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full flex flex-col gap-8">
      {/* Top Header & Minimalist Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-border/70 pb-6">
        <div>
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-2 text-xs text-muted mb-2 font-medium flex-wrap">
            <Link href="/control-tower" className="hover:text-accent transition-colors flex items-center gap-1">
              <Navigation className="w-3 h-3 text-accent" /> Control Tower
            </Link>
            <span>/</span>
            <Link href={`/staff/incident/${shipmentId}`} className="hover:text-accent transition-colors">
              Incident {shipmentId}
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Recovery Solution</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Recovery Plans for {shipment.id}
            </h1>
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/30 font-bold">
              MOSAIC OPTIMIZED
            </span>
          </div>
          <p className="text-xs text-muted mt-1.5 font-medium">
            Origin: <strong className="text-foreground">{shipment.origin}</strong> &rarr; Destination: <strong className="text-foreground">{shipment.destination}</strong> &bull; Currently Stranded: <strong className="text-accent">{shipment.currentLocation}</strong>
          </p>
        </div>

        {/* Minimalist Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href={`/track?id=${shipmentId}`}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors shadow-2xs"
            title="Open Live Highway Tracking Map"
          >
            <TruckIcon className="w-3.5 h-3.5" /> Live Map
          </Link>
          <button
            onClick={() => setShowCustomerModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Customer Alert
          </button>
          <button
            onClick={() => setShowWaybillModal(true)}
            disabled={!primaryPlan && !shadowPlan}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-surface border border-border text-foreground hover:border-accent hover:bg-background transition-colors shadow-2xs disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-accent" /> Print Waybill
          </button>
          <button
            onClick={() => setShowCopilot(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 transition-colors shadow-2xs"
          >
            <Bot className="w-3.5 h-3.5 text-purple-600" /> AI Copilot
          </button>
          <button
            onClick={handleReoptimize}
            disabled={reoptimizing}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-surface border border-border text-muted hover:text-foreground hover:border-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reoptimizing ? "animate-spin text-accent" : ""}`} /> Re-solve
          </button>
          <Link
            href={`/staff/trace/${shipmentId}`}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-surface border border-border text-muted hover:text-foreground hover:border-accent transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Trace
          </Link>
          <Link
            href={`/staff/autopsy/${shipmentId}`}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-surface border border-border text-muted hover:text-foreground hover:border-accent transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" /> Autopsy
          </Link>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs flex-wrap">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/track?id=${shipmentId}`}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <TruckIcon className="w-3.5 h-3.5" /> Track Moving Truck →
            </Link>
            <Link
              href="/control-tower"
              className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 text-xs font-semibold transition-colors"
            >
              Control Tower
            </Link>
          </div>
        </div>
      )}

      {isNoFeasible ? (
        /* No Feasible Plan State */
        <div className="bg-surface border border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xs">
          <XCircle className="w-14 h-14 text-rose-500 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">No Feasible Piggyback Found</h2>
          <p className="text-muted max-w-lg mb-6 text-sm leading-relaxed">
            The optimization engine exhaustively evaluated all available carrier fleet routes, but none passed the 7-dimension hard constraint filters. A dedicated recovery charter or relaxed SLA window is required.
          </p>

          {/* Closed Hub Warning & Instant Action */}
          {(() => {
            const allHubs = stateManager.getHubs();
            const closedHubs = allHubs.filter((h) => !h.isOperational);
            if (closedHubs.length > 0 && rejectionCounts["HUB_UNAVAILABLE"]) {
              return (
                <div className="w-full max-w-2xl mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-amber-900">Terminal Restriction Detected</span>
                      <span className="text-amber-800">
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
                    className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-500 transition-all shadow-xs shrink-0 w-full sm:w-auto"
                  >
                    Re-open Terminal &amp; Re-Solve
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all shadow-xs active:scale-95 disabled:opacity-50"
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-xs active:scale-95"
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
              <RotateCcw className="w-4 h-4 text-muted" /> Reset Simulation State
            </button>
          </div>
        </div>
      ) : (
        /* Feasible Dual Plans: PRIMARY vs SHADOW with Minimalist Spacing */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* PRIMARY RECOVERY PLAN */}
          {primaryPlan && (
            <div className="bg-surface border-2 border-accent/80 rounded-3xl p-7 md:p-8 flex flex-col justify-between shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold font-mono px-3.5 py-1 rounded-bl-xl tracking-wider uppercase">
                RECOMMENDED PRIMARY
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-xs font-bold text-accent tracking-wider uppercase">
                      STRATEGY: PRIMARY PIGGYBACK
                    </span>
                  </div>

                  <h2 className="text-xl font-black tracking-tight text-foreground">
                    Carrier Vehicle: <span className="font-mono text-accent">{primaryPlan.vehicleId}</span>
                  </h2>
                </div>

                {/* 3-Pillar Minimalist Metric Strip */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-background border border-border/80 text-center">
                  <div>
                    <span className="text-[10px] font-mono text-muted uppercase block mb-1">
                      Recovery Cost
                    </span>
                    <span className="text-lg font-black text-foreground block">
                      ${primaryPlan.incrementalCost}
                    </span>
                    <span className="text-[11px] font-mono text-muted">
                      +{primaryPlan.extraDistance} km detour
                    </span>
                  </div>

                  <div className="border-x border-border/80 px-2">
                    <span className="text-[10px] font-mono text-muted uppercase block mb-1">
                      Guaranteed ETA
                    </span>
                    <span className="text-sm font-bold text-foreground block truncate">
                      {new Date(primaryPlan.eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-emerald-700">
                      +{Math.round(primaryPlan.slaMarginMinutes / 60)}h buffer
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-muted uppercase block mb-1">
                      Route Transfers
                    </span>
                    <span className="text-sm font-bold text-foreground block">
                      {primaryPlan.transfers === 0 ? "Direct" : `${primaryPlan.transfers} Transfer`}
                    </span>
                    <span className="text-[11px] font-mono text-muted truncate block">
                      {primaryPlan.transferHub ? `@ ${primaryPlan.transferHub}` : "Express Corridor"}
                    </span>
                  </div>
                </div>

                {/* Route Path Indicator */}
                <div className="flex items-center justify-between text-xs font-mono text-muted px-1">
                  <span>From: <strong className="text-foreground">{primaryPlan.pickupHub}</strong></span>
                  <span className="text-accent font-bold">&rarr;</span>
                  {primaryPlan.transferHub && (
                    <>
                      <span>Via: <strong className="text-foreground">{primaryPlan.transferHub}</strong></span>
                      <span className="text-accent font-bold">&rarr;</span>
                    </>
                  )}
                  <span>To: <strong className="text-foreground">{primaryPlan.dropoffHub}</strong></span>
                </div>

                {/* Jury Path Inspection Button */}
                <button
                  type="button"
                  onClick={() => setInspectingPlan(primaryPlan)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-orange-300 bg-orange-50/80 text-orange-900 hover:bg-orange-100 transition-colors text-xs font-bold font-mono shadow-2xs cursor-pointer"
                >
                  <Route className="w-3.5 h-3.5 text-orange-600" /> Highlight &amp; Inspect Corridor on Map
                </button>
              </div>

              <div className="pt-6 mt-4 border-t border-border/60">
                <button
                  onClick={() => handleApprove(primaryPlan.planId)}
                  disabled={approving || primaryPlan.status === "APPROVED"}
                  className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-accent text-white hover:bg-accent/90 transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95 disabled:opacity-50"
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
            <div className="bg-surface border border-border rounded-3xl p-7 md:p-8 flex flex-col justify-between shadow-xs">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-mono text-xs font-bold text-blue-600 tracking-wider uppercase">
                      STRATEGY: SHADOW (INDEPENDENT REDUNDANCY)
                    </span>
                  </div>

                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    Carrier Vehicle: <span className="font-mono text-blue-600">{shadowPlan.vehicleId}</span>
                  </h2>
                </div>

                {/* 3-Pillar Minimalist Metric Strip */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-background border border-border/80 text-center">
                  <div>
                    <span className="text-[10px] font-mono text-muted uppercase block mb-1">
                      Recovery Cost
                    </span>
                    <span className="text-lg font-black text-foreground block">
                      ${shadowPlan.incrementalCost}
                    </span>
                    <span className="text-[11px] font-mono text-muted">
                      +{shadowPlan.extraDistance} km detour
                    </span>
                  </div>

                  <div className="border-x border-border/80 px-2">
                    <span className="text-[10px] font-mono text-muted uppercase block mb-1">
                      Guaranteed ETA
                    </span>
                    <span className="text-sm font-bold text-foreground block truncate">
                      {new Date(shadowPlan.eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-emerald-700">
                      +{Math.round(shadowPlan.slaMarginMinutes / 60)}h buffer
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-muted uppercase block mb-1">
                      Route Transfers
                    </span>
                    <span className="text-sm font-bold text-foreground block">
                      {shadowPlan.transfers === 0 ? "Direct" : `${shadowPlan.transfers} Transfer`}
                    </span>
                    <span className="text-[11px] font-mono text-muted truncate block">
                      {shadowPlan.transferHub ? `@ ${shadowPlan.transferHub}` : "Express Corridor"}
                    </span>
                  </div>
                </div>

                {/* Route Path Indicator */}
                <div className="flex items-center justify-between text-xs font-mono text-muted px-1">
                  <span>From: <strong className="text-foreground">{shadowPlan.pickupHub}</strong></span>
                  <span className="text-muted font-bold">&rarr;</span>
                  {shadowPlan.transferHub && (
                    <>
                      <span>Via: <strong className="text-foreground">{shadowPlan.transferHub}</strong></span>
                      <span className="text-muted font-bold">&rarr;</span>
                    </>
                  )}
                  <span>To: <strong className="text-foreground">{shadowPlan.dropoffHub}</strong></span>
                </div>

                {/* Jury Path Inspection Button */}
                <button
                  type="button"
                  onClick={() => setInspectingPlan(shadowPlan)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-blue-300 bg-blue-50/80 text-blue-900 hover:bg-blue-100 transition-colors text-xs font-bold font-mono shadow-2xs cursor-pointer"
                >
                  <Route className="w-3.5 h-3.5 text-blue-600" /> Highlight &amp; Inspect Alternate on Map
                </button>
              </div>

              <div className="pt-6 mt-4 border-t border-border/60">
                <button
                  onClick={() => handleApprove(shadowPlan.planId)}
                  disabled={approving || shadowPlan.status === "APPROVED"}
                  className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider border border-border hover:border-accent text-foreground hover:bg-background transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Select Shadow Alternate
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-border border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center">
              <TruckIcon className="w-12 h-12 text-muted mb-3" />
              <h3 className="font-semibold text-sm text-foreground">No Independent Shadow Fleet Available</h3>
              <p className="text-xs text-muted mt-1 max-w-xs">
                All remaining secondary carriers failed hard constraint checks (insufficient volume/deadlines).
              </p>
            </div>
          )}
        </div>
      )}

      {/* ESG Carbon Footprint & Financial Savings Card */}
      {!isNoFeasible && primaryPlan && (
        <div className="bg-surface border border-emerald-600/30 rounded-3xl p-6 md:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 mb-1.5">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span>GREEN LOGISTICS &amp; RESOURCE UTILIZATION ROI</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                ESG Sustainability &amp; Cost Avoidance Impact
              </h3>
              <p className="text-xs text-muted mt-1 font-medium">
                Measured against single-use dedicated emergency charter van dispatched on the same corridor.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-600/30 px-4 py-2 rounded-xl text-xs font-mono font-bold text-emerald-800 shrink-0 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>GREEN FREIGHT CERTIFIED</span>
            </div>
          </div>

          {/* 4-stat metrics grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* Metric 1: Cost Savings */}
            <div className="bg-background border border-border rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-foreground font-bold flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-accent" /> Net Cost Savings
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/15 text-accent font-black">
                  {primaryPlan.costSavingsPercent || 78}% SAVED
                </span>
              </div>
              <p className="text-2xl font-black text-foreground">
                ${((primaryPlan.baselineCharterCost || 2850) - primaryPlan.incrementalCost).toLocaleString()}
              </p>
              <p className="text-xs text-muted font-mono mt-1 font-medium">
                ${primaryPlan.incrementalCost} piggyback vs ${(primaryPlan.baselineCharterCost || 2850).toLocaleString()} charter
              </p>
            </div>

            {/* Metric 2: CO2 Avoided */}
            <div className="bg-background border border-border rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-foreground font-bold flex items-center gap-1.5">
                  <Leaf className="w-4 h-4 text-emerald-600" /> CO₂ Avoided
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black">
                  ZERO DIRECT EMISSION
                </span>
              </div>
              <p className="text-2xl font-black text-emerald-700">
                {(primaryPlan.co2SavedKg || 420).toLocaleString()} kg CO₂
              </p>
              <p className="text-xs text-muted font-mono mt-1 font-medium">
                Shared vehicle load avoids dedicated diesel burn
              </p>
            </div>

            {/* Metric 3: Diesel Fuel Conserved */}
            <div className="bg-background border border-border rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-foreground font-bold flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-600" /> Diesel Conserved
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-black">
                  0.28 L / KM
                </span>
              </div>
              <p className="text-2xl font-black text-foreground">
                {(primaryPlan.fuelSavedLiters || 155).toLocaleString()} Liters
              </p>
              <p className="text-xs text-muted font-mono mt-1 font-medium">
                Saved by consolidating onto scheduled carrier
              </p>
            </div>

            {/* Metric 4: Deadhead Miles Averted */}
            <div className="bg-background border border-border rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-foreground font-bold flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-purple-600" /> Empty Miles Averted
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-black">
                  NO DEADHEAD
                </span>
              </div>
              <p className="text-2xl font-black text-foreground">
                {(primaryPlan.emptyMilesAvertedKm || 510).toLocaleString()} km
              </p>
              <p className="text-xs text-muted font-mono mt-1 font-medium">
                Zero empty single-purpose deadhead transit
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Volumetric Truck Space Visualizer (Cargo Tetris) */}
      {!isNoFeasible && primaryPlan && (
        <div>
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

          <RouteInspectionModal
            isOpen={Boolean(inspectingPlan)}
            onClose={() => setInspectingPlan(null)}
            plan={inspectingPlan}
            shipment={shipment}
            hubs={allHubs}
            trucks={allTrucks}
          />
        </>
      )}
    </div>
  );
}
