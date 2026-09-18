"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { stateManager } from "@/lib/engine/state-manager";
import { DecisionReceipt, StaffShipment } from "@/lib/engine/types";
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Fingerprint,
  Scale,
  ShieldCheck,
  Timer,
  XCircle,
  Zap,
} from "lucide-react";

export default function DecisionTracePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const shipmentId = resolvedParams.id;
  const router = useRouter();

  const [shipment, setShipment] = useState<StaffShipment | null>(null);
  const [receipt, setReceipt] = useState<DecisionReceipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = stateManager.getShipment(shipmentId);
    setShipment(s || null);

    let r = stateManager.getReceipt(shipmentId);
    if (!r && s) {
      const res = stateManager.solveRecovery(shipmentId);
      r = res.receipt;
    }
    setReceipt(r || null);
    setLoading(false);
  }, [shipmentId]);

  if (loading) {
    return <div className="p-10 font-mono text-muted">Retrieving cryptographic receipt...</div>;
  }

  if (!receipt || !shipment) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold">Decision Trace Unavailable</h2>
        <p className="text-sm text-muted mt-2">Run recovery to generate an auditable decision receipt.</p>
        <Link href={`/staff/recovery/${shipmentId}`} className="text-accent text-sm mt-4 inline-block font-semibold">
          &larr; Run Recovery Solver
        </Link>
      </div>
    );
  }

  const isNoFeasible = receipt.status === "NO_FEASIBLE_PIGGYBACK";

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full flex flex-col gap-6">
      {/* Top Header */}
      <div>
        <Link
          href={`/staff/recovery/${shipmentId}`}
          className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Recovery Options
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Decision Trace: {shipment.id}
            </h1>
            <p className="text-xs text-muted mt-1">
              Cryptographically verifiable proof of CP-SAT solver decisions and 7-dimension constraint evaluation.
            </p>
          </div>
        </div>
      </div>

      {/* Proof Card */}
      <div className="bg-surface/70 border border-border/80 rounded-3xl overflow-hidden shadow-xl">
        {/* Banner Header */}
        <div className="bg-surface border-b border-border/80 p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isNoFeasible ? (
              <XCircle className="w-6 h-6 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            )}
            <div>
              <h3 className="text-base font-bold text-foreground">Solver Status: {receipt.status}</h3>
              <p className="text-xs font-mono text-muted">
                Evaluated {receipt.totalCandidatesEvaluated} Candidates ({receipt.feasibleCandidatesCount} Feasible, {receipt.rejectedCandidates.length} Rejected)
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-xs text-muted">
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold justify-end">
              <Fingerprint className="w-4 h-4" /> Hash: {receipt.hash}
            </div>
            <div className="text-[10px] text-muted/70 mt-1">
              Solve Time: <strong className="text-foreground">{receipt.solveTimeMs} ms</strong> · {new Date(receipt.createdAt).toISOString()}
            </div>
          </div>
        </div>

        {/* Hard Constraint Math Check Cards */}
        {!isNoFeasible && (
          <div className="p-6 border-b border-border/60">
            <h4 className="text-xs font-mono font-bold uppercase text-muted tracking-wider mb-4">
              Hard Constraint Mathematical Verification
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-background/70 p-4 rounded-2xl border border-border/70 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted block mb-0.5">Weight Margin</span>
                  <span className="text-sm font-semibold text-foreground">Residual Fleet Capacity</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 text-sm font-bold">
                    +{receipt.weightCheckMargin?.toFixed(1)} kg
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>

              <div className="bg-background/70 p-4 rounded-2xl border border-border/70 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted block mb-0.5">Pickup Time Margin</span>
                  <span className="text-sm font-semibold text-foreground">Departure Feasibility</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 text-sm font-bold">
                    +{receipt.timeCheckPickupMarginMinutes} min
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>

              <div className="bg-background/70 p-4 rounded-2xl border border-border/70 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted block mb-0.5">SLA Margin</span>
                  <span className="text-sm font-semibold text-foreground">Delivery Window Feasibility</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 text-sm font-bold">
                    +{receipt.deliveryCheckSlaMarginMinutes} min buffer
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>

              <div className="bg-background/70 p-4 rounded-2xl border border-border/70 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted block mb-0.5">Downstream Schedule Delay</span>
                  <span className="text-sm font-semibold text-foreground">Cascade Impact</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 text-sm font-bold">
                    +{receipt.downstreamRouteCheckDelayMinutes} min delay
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rejected Candidates Table */}
        <div className="p-6">
          <h4 className="text-xs font-mono font-bold uppercase text-muted tracking-wider mb-4">
            Rejected Alternative Candidate Routes ({receipt.rejectedCandidates.length})
          </h4>

          {receipt.rejectedCandidates.length === 0 ? (
            <div className="text-muted text-xs italic p-4 bg-background/50 rounded-xl text-center border border-border/50">
              No rejected candidates. All evaluated carrier paths passed constraint checks.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/70 bg-background/50">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-surface/50 font-mono text-muted text-[10px] tracking-wider uppercase">
                    <th className="px-4 py-3">Carrier / Vehicle</th>
                    <th className="px-4 py-3">Segment Leg</th>
                    <th className="px-4 py-3">Disqualification Reason</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.rejectedCandidates.map((c, i) => (
                    <tr key={i} className="border-b border-border/40 hover:bg-surface/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-foreground">{c.vehicleId}</td>
                      <td className="px-4 py-3 text-muted">
                        {c.pickupHub} → {c.dropoffHub}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          {c.rejectionReason}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[10px] text-muted">
                        FILTERED OUT
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
