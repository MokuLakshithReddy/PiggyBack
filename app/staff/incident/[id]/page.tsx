"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { stateManager } from "@/lib/engine/state-manager";
import { StaffShipment, Cargo } from "@/lib/engine/types";
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Clock,
  MapPin,
  Package,
  ShieldAlert,
  Zap,
} from "lucide-react";

export default function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const shipmentId = resolvedParams.id;
  const router = useRouter();

  const [shipment, setShipment] = useState<StaffShipment | null>(null);
  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);

  useEffect(() => {
    const s = stateManager.getShipment(shipmentId);
    if (s) {
      setShipment(s);
      const c = stateManager.getCargo().find((item) => item.shipmentId === s.id);
      setCargo(c || null);
    }
    setLoading(false);
  }, [shipmentId]);

  const handleRunRecovery = () => {
    setSolving(true);
    setTimeout(() => {
      try {
        stateManager.solveRecovery(shipmentId);
        router.push(`/staff/recovery/${shipmentId}`);
      } catch (e) {
        console.error(e);
        setSolving(false);
      }
    }, 450);
  };

  if (loading) {
    return <div className="p-10 text-muted font-mono">Loading incident telemetry...</div>;
  }

  if (!shipment) {
    return (
      <div className="p-10 max-w-lg mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Shipment Not Found</h2>
        <p className="text-sm text-muted mt-2">No shipment registered with ID {shipmentId}</p>
        <Link href="/staff/shipments" className="mt-4 inline-block text-accent text-sm font-medium">
          &larr; Back to Shipments
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Operations
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" /> OPERATIONAL ANOMALY DETECTED
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Incident Analysis: {shipment.id}
          </h1>
          <p className="text-sm text-muted mt-1 font-mono">Tracking Code: {shipment.code}</p>
        </div>

        <button
          onClick={handleRunRecovery}
          disabled={solving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-accent text-white hover:bg-accent/90 transition-all shadow-lg active:scale-95 disabled:opacity-50 shrink-0"
        >
          <Zap className="w-4 h-4" />
          {solving ? "Synthesizing CP-SAT Plans..." : "Run MOSAIC Optimizer →"}
        </button>
      </div>

      {/* Incident Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface/60 border border-rose-500/30 rounded-2xl p-5 shadow-md">
          <span className="font-mono text-[10px] text-muted tracking-wider uppercase block mb-1">
            DISRUPTION STATUS
          </span>
          <span className="text-lg font-bold text-rose-400 block mb-1">
            {shipment.status.toUpperCase()}
          </span>
          <p className="text-xs text-muted/80">{shipment.disruptionReason || "Routing anomaly during sorting"}</p>
        </div>

        <div className="bg-surface/60 border border-border/80 rounded-2xl p-5 shadow-md">
          <span className="font-mono text-[10px] text-muted tracking-wider uppercase block mb-1">
            CURRENT STRANDED LOCATION
          </span>
          <div className="flex items-center gap-2 text-lg font-bold text-foreground">
            <MapPin className="w-5 h-5 text-accent shrink-0" />
            <span>{shipment.currentLocation}</span>
          </div>
          <p className="text-xs text-muted/80 mt-1">
            Target Destination: <strong>{shipment.destination}</strong>
          </p>
        </div>

        <div className="bg-surface/60 border border-border/80 rounded-2xl p-5 shadow-md">
          <span className="font-mono text-[10px] text-muted tracking-wider uppercase block mb-1">
            SLA DEADLINE
          </span>
          <div className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              {new Date(shipment.deadline).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
              {new Date(shipment.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <p className="text-xs text-muted/80 mt-1">Priority: {shipment.priority}</p>
        </div>
      </div>

      {/* Cargo & Linehaul Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface/60 border border-border/80 rounded-2xl p-6 shadow-md">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-accent" /> Cargo Specifications
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted">Description:</span>
              <span className="font-medium text-foreground">{cargo?.description || "High-Value Cargo"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted">Payload Weight:</span>
              <span className="font-mono text-foreground">{shipment.weight} kg</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted">Displacement Volume:</span>
              <span className="font-mono text-foreground">{shipment.volume} m³</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted">Special Handling:</span>
              <span className="font-mono text-accent">{cargo?.specialHandling || "Standard"}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface/60 border border-border/80 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" /> Disruption Impact
            </h3>

            <p className="text-xs text-muted leading-relaxed mb-4">
              The shipment is currently off-corridor at <strong>{shipment.currentLocation}</strong>. Continuing on traditional dedicated recovery would require chartering an exclusive vehicle, costing ~$450+ and emitting excess carbon.
            </p>

            <div className="bg-background/80 rounded-xl p-3 border border-border/60 text-xs font-mono text-muted space-y-1">
              <div>• Disruption Timestamp: {shipment.disruptionTimestamp || "Active Incident"}</div>
              <div>• SLA Risk Level: High (Pending Intervention)</div>
              <div>• Candidate Fleet: Active carriers with spare volume passing through corridor</div>
            </div>
          </div>

          <button
            onClick={handleRunRecovery}
            disabled={solving}
            className="mt-6 w-full py-3 rounded-xl font-semibold bg-accent text-white hover:bg-accent/90 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
          >
            <Zap className="w-4 h-4" /> Run MOSAIC Optimizer Now
          </button>
        </div>
      </div>
    </div>
  );
}
