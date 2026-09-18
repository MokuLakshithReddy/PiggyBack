"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { stateManager } from "@/lib/engine/state-manager";
import { AutopsyReport, StaffShipment } from "@/lib/engine/types";
import {
  Activity,
  ArrowRight,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  DollarSign,
  Fuel,
  MapPin,
  TrendingDown,
} from "lucide-react";

export default function AutopsyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const shipmentId = resolvedParams.id;
  const router = useRouter();

  const [autopsy, setAutopsy] = useState<AutopsyReport | null>(null);
  const [shipment, setShipment] = useState<StaffShipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = stateManager.getShipment(shipmentId);
    setShipment(s || null);

    try {
      const rep = stateManager.getAutopsy(shipmentId);
      setAutopsy(rep);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [shipmentId]);

  if (loading) {
    return <div className="p-10 font-mono text-muted">Reconstructing network autopsy telemetry...</div>;
  }

  if (!autopsy || !shipment) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold">Autopsy Unavailable</h2>
        <p className="text-sm text-muted mt-2">Generate a recovery plan to inspect historical incident autopsy.</p>
        <Link href={`/staff/recovery/${shipmentId}`} className="text-accent text-sm mt-4 inline-block font-semibold">
          &larr; Return to Recovery
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link
          href={`/staff/recovery/${shipmentId}`}
          className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Recovery Options
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Network Autopsy: {shipment.id}
            </h1>
            <p className="text-xs text-muted mt-1">
              Historical reconstruction of incident cascade and counterfactual baseline comparison.
            </p>
          </div>
        </div>
      </div>

      {/* Incident Cause Callout */}
      <div className="bg-surface/70 border border-border/80 rounded-3xl p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="font-mono text-xs text-amber-400 font-bold uppercase tracking-wider">
            ROOT CAUSE SUMMARY
          </span>
          <span className="text-xs font-mono text-muted">
            Occurred: {new Date(autopsy.occurredAt).toLocaleTimeString()} · {new Date(autopsy.occurredAt).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-foreground font-medium leading-relaxed mb-4">
          {autopsy.rootCause}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted pt-3 border-t border-border/60">
          <span>Anomaly Type: <strong className="text-foreground">{autopsy.disruptionType}</strong></span>
          <span>Affected Hub: <strong className="text-foreground">{autopsy.affectedHub}</strong></span>
          <span>SLA Preserved: <strong className="text-emerald-400">YES</strong></span>
        </div>
      </div>

      {/* Side-by-Side Comparative Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MOSAIC Execution */}
        <div className="bg-surface/80 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> MOSAIC Dynamic Piggyback
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                EXECUTED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-background/80 p-3.5 rounded-2xl border border-border/60">
                <span className="text-[10px] uppercase font-mono text-muted block mb-1">Final Delivery ETA</span>
                <span className="font-mono text-base font-bold text-foreground">
                  {new Date(autopsy.actualPlan.eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="bg-background/80 p-3.5 rounded-2xl border border-border/60">
                <span className="text-[10px] uppercase font-mono text-muted block mb-1">Incremental Cost</span>
                <span className="font-mono text-base font-bold text-emerald-400">
                  ${autopsy.actualPlan.cost}
                </span>
              </div>
              <div className="bg-background/80 p-3.5 rounded-2xl border border-border/60">
                <span className="text-[10px] uppercase font-mono text-muted block mb-1">Detour Distance</span>
                <span className="font-mono text-base font-bold text-foreground">
                  +{autopsy.actualPlan.distance} km
                </span>
              </div>
              <div className="bg-background/80 p-3.5 rounded-2xl border border-border/60">
                <span className="text-[10px] uppercase font-mono text-muted block mb-1">Transfer Hops</span>
                <span className="font-mono text-base font-bold text-foreground">
                  {autopsy.actualPlan.transfers}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Utilized spare volume on scheduled linehaul vehicle <strong>{autopsy.actualPlan.vehicleId}</strong> without requiring a new dedicated driver run.
            </p>
          </div>
        </div>

        {/* Counterfactual Baseline (Charter / Nearest Feasible) */}
        <div className="bg-surface/40 border border-border/70 border-dashed rounded-3xl p-6 shadow-md opacity-90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" /> Baseline Counterfactual
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface text-muted font-bold">
                AVOIDED
              </span>
            </div>

            {autopsy.baselinePlan ? (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-background/50 p-3.5 rounded-2xl border border-border/40">
                  <span className="text-[10px] uppercase font-mono text-muted block mb-1">Baseline ETA</span>
                  <span className="font-mono text-base font-bold text-muted">
                    {new Date(autopsy.baselinePlan.eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="bg-background/50 p-3.5 rounded-2xl border border-border/40">
                  <span className="text-[10px] uppercase font-mono text-muted block mb-1">Baseline Cost</span>
                  <span className="font-mono text-base font-bold text-rose-400">
                    ${autopsy.baselinePlan.cost}
                  </span>
                </div>
                <div className="bg-background/50 p-3.5 rounded-2xl border border-border/40">
                  <span className="text-[10px] uppercase font-mono text-muted block mb-1">Distance Added</span>
                  <span className="font-mono text-base font-bold text-muted">
                    +{autopsy.baselinePlan.distance} km
                  </span>
                </div>
                <div className="bg-background/50 p-3.5 rounded-2xl border border-border/40">
                  <span className="text-[10px] uppercase font-mono text-muted block mb-1">Transfers</span>
                  <span className="font-mono text-base font-bold text-muted">
                    {autopsy.baselinePlan.transfers}
                  </span>
                </div>
              </div>
            ) : null}

            <p className="text-xs text-muted leading-relaxed">
              Standard operational response would require emergency charter van dispatch, incurring high surcharge penalties and driver overtime.
            </p>
          </div>
        </div>
      </div>

      {/* Impact Metric Strip */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-accent/10 to-blue-500/10 border border-emerald-500/30 rounded-3xl p-6 flex flex-wrap items-center justify-around gap-4 text-center">
        <div>
          <span className="text-xs font-mono text-muted uppercase block mb-1">Direct Operational Savings</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono">
            +${autopsy.cascadeImpact.costSavingsVsCharter}
          </span>
        </div>
        <div className="w-px h-10 bg-border hidden sm:block" />
        <div>
          <span className="text-xs font-mono text-muted uppercase block mb-1">Customer SLA Status</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono">100% PRESERVED</span>
        </div>
        <div className="w-px h-10 bg-border hidden sm:block" />
        <div>
          <span className="text-xs font-mono text-muted uppercase block mb-1">Charter Run Avoided</span>
          <span className="text-2xl font-bold text-foreground font-mono">1 EMERGENCY VEHICLE</span>
        </div>
      </div>

      {/* Telemetry Event Timeline */}
      <div className="bg-surface/70 border border-border/80 rounded-3xl p-6 shadow-md">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent" /> Telemetry Event Chronology
        </h3>

        <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
          {autopsy.eventTimeline.map((ev, i) => (
            <div key={i} className="flex items-start gap-4 relative pl-8">
              <span className="w-2.5 h-2.5 rounded-full bg-accent absolute left-2.5 top-1.5 -translate-x-1/2 ring-4 ring-background" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-0.5">
                  <span className="font-mono text-xs font-bold text-foreground">{ev.event}</span>
                  <span className="font-mono text-[10px] text-muted">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">{ev.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
