"use client";

import React from "react";
import { X, Printer, QrCode, ShieldCheck, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import { DecisionReceipt, RecoveryPlan, StaffShipment } from "@/lib/engine/types";

interface DigitalWaybillModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: StaffShipment;
  plan: RecoveryPlan;
  receipt?: DecisionReceipt | null;
}

export function DigitalWaybillModal({
  isOpen,
  onClose,
  shipment,
  plan,
  receipt,
}: DigitalWaybillModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const waybillNo = `WB-${shipment.id.replace("SHP-", "")}-${plan.vehicleId.replace("TRK-", "")}-${Date.now().toString().slice(-4)}`;
  const driverName = "Devendra Sharma";
  const vehicleReg = "MH-31-TR-4921";
  const crossDockGate = `Bay 04 (${plan.pickupHub} Terminal)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      {/* Container */}
      <div className="bg-background text-foreground border border-border w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            <span className="font-semibold text-sm">Official Logistics Waybill Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-accent text-white hover:bg-accent/90 transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 md:p-10 space-y-6 print:p-0 print:space-y-4 print:text-black">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-border pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                  MOSAIC AUTONOMOUS LOGISTICS
                </span>
                <span className="font-mono text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  PIGGYBACK HANDOVER CERTIFIED
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight mt-2 text-foreground">
                CARGO TRANSFER MANIFEST & WAYBILL
              </h1>
              <p className="text-xs text-muted font-mono mt-0.5">
                Inter-Hub Handover Document for Cross-Dock Piggybacking Operation
              </p>
            </div>

            {/* Simulated Scannable Barcode & QR code */}
            <div className="flex items-center gap-3 shrink-0">
              {/* QR Code SVG */}
              <div className="w-20 h-20 p-1.5 bg-white rounded-lg border border-border flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Outer corner markers */}
                  <rect x="5" y="5" width="30" height="30" fill="black" />
                  <rect x="10" y="10" width="20" height="20" fill="white" />
                  <rect x="15" y="15" width="10" height="10" fill="black" />

                  <rect x="65" y="5" width="30" height="30" fill="black" />
                  <rect x="70" y="10" width="20" height="20" fill="white" />
                  <rect x="75" y="15" width="10" height="10" fill="black" />

                  <rect x="5" y="65" width="30" height="30" fill="black" />
                  <rect x="10" y="70" width="20" height="20" fill="white" />
                  <rect x="15" y="75" width="10" height="10" fill="black" />

                  {/* Synthetic Data matrix dots */}
                  <rect x="42" y="10" width="8" height="8" fill="black" />
                  <rect x="52" y="20" width="6" height="6" fill="black" />
                  <rect x="42" y="32" width="6" height="8" fill="black" />
                  <rect x="15" y="42" width="8" height="6" fill="black" />
                  <rect x="30" y="42" width="10" height="6" fill="black" />
                  <rect x="45" y="45" width="10" height="10" fill="black" />
                  <rect x="62" y="45" width="8" height="6" fill="black" />
                  <rect x="75" y="42" width="12" height="6" fill="black" />
                  <rect x="42" y="65" width="8" height="8" fill="black" />
                  <rect x="60" y="65" width="12" height="6" fill="black" />
                  <rect x="52" y="78" width="8" height="10" fill="black" />
                  <rect x="68" y="78" width="10" height="10" fill="black" />
                  <rect x="85" y="68" width="8" height="8" fill="black" />
                </svg>
              </div>

              <div className="text-right font-mono text-[11px] space-y-1">
                <div>
                  <span className="text-muted block text-[9px] uppercase">Manifest No</span>
                  <span className="font-bold text-foreground">{waybillNo}</span>
                </div>
                <div>
                  <span className="text-muted block text-[9px] uppercase">Generated</span>
                  <span>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Grid Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            {/* Box 1: Shipment Info */}
            <div className="bg-surface/50 border border-border rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
                1. Consignment Profile
              </span>
              <div>
                <span className="text-muted block text-[10px]">Shipment Identifier</span>
                <span className="font-bold text-sm text-foreground">{shipment.id}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">Customer Code</span>
                <span className="text-foreground">{shipment.code}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">Weight / Volume</span>
                <span className="text-foreground font-semibold">{shipment.weight} kg &bull; {shipment.volume} m³</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">Priority Tier</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 inline-block">
                  {shipment.priority || "High"} Priority
                </span>
              </div>
            </div>

            {/* Box 2: Route & Transit */}
            <div className="bg-surface/50 border border-border rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
                2. Routing Corridor
              </span>
              <div>
                <span className="text-muted block text-[10px]">Misplaced Pickup Hub</span>
                <span className="text-rose-400 font-bold">{plan.pickupHub} Hub</span>
              </div>
              <div className="flex items-center gap-1 text-muted text-[10px]">
                <span>&darr; Transfer via Piggyback Corridor</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">Destination Hub</span>
                <span className="text-emerald-400 font-bold">{plan.dropoffHub} Hub</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">Target Delivery ETA</span>
                <span className="text-foreground font-semibold">
                  {new Date(plan.eta).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>

            {/* Box 3: Carrier & Driver */}
            <div className="bg-surface/50 border border-border rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
                3. Assigned Piggyback Carrier
              </span>
              <div>
                <span className="text-muted block text-[10px]">Vehicle ID</span>
                <span className="font-bold text-foreground text-sm">{plan.vehicleId}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">Vehicle Registration Plate</span>
                <span className="text-foreground font-semibold">{vehicleReg}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">Primary Driver</span>
                <span className="text-foreground">{driverName}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">Transfer Dock Bay</span>
                <span className="text-accent font-semibold">{crossDockGate}</span>
              </div>
            </div>
          </div>

          {/* Simulated Code-128 Linear Barcode */}
          <div className="bg-white text-black p-3 rounded-xl border border-border flex flex-col items-center justify-center space-y-1">
            <div className="h-10 w-full flex items-center justify-center gap-1 overflow-hidden px-4">
              {Array.from({ length: 55 }).map((_, i) => {
                const widths = [1, 2, 3, 1, 4, 2, 1, 3];
                const w = widths[i % widths.length];
                return (
                  <div
                    key={i}
                    style={{ width: `${w}px` }}
                    className={`h-full ${i % 2 === 0 ? "bg-black" : "bg-white"}`}
                  />
                );
              })}
            </div>
            <span className="font-mono text-[10px] font-bold tracking-widest">{waybillNo}</span>
          </div>

          {/* Cryptographic Proof Verification Box */}
          <div className="border border-border/80 rounded-xl p-4 bg-surface/30 font-mono text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>CRYPTOGRAPHIC DECISION RECEIPT & AUDIT TRAIL</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-muted">
              <div>
                <span>Receipt Hash: </span>
                <span className="text-foreground font-bold">{receipt?.hash || "SHA256: 8f9b2c34a...582e01"}</span>
              </div>
              <div>
                <span>Feasible Candidates Checked: </span>
                <span className="text-foreground font-bold">{receipt?.totalCandidatesEvaluated || 6} evaluated</span>
              </div>
              <div>
                <span>Optimizer Engine: </span>
                <span className="text-foreground font-bold">MOSAIC Lexicographic Solver v4.2</span>
              </div>
              <div>
                <span>SLA Margin Slack: </span>
                <span className="text-emerald-400 font-bold">+{plan.slaMarginMinutes} mins buffer</span>
              </div>
            </div>
          </div>

          {/* Dual Handover Sign-Off Block */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border">
            <div className="space-y-4">
              <span className="text-[10px] font-bold font-mono text-muted uppercase tracking-wider block">
                Transferring Hub Supervisor
              </span>
              <div className="h-14 border-b border-dashed border-muted/50 flex items-end pb-1 font-mono text-xs italic text-muted">
                Authorized: R. K. Meena (Terminal Ops)
              </div>
              <div className="text-[10px] font-mono text-muted">Date & Time: {new Date().toLocaleDateString("en-IN")}</div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-bold font-mono text-muted uppercase tracking-wider block">
                Receiving Piggyback Carrier Driver
              </span>
              <div className="h-14 border-b border-dashed border-muted/50 flex items-end pb-1 font-mono text-xs italic text-muted">
                Accepted: {driverName} ({plan.vehicleId})
              </div>
              <div className="text-[10px] font-mono text-muted">Date & Time: {new Date().toLocaleDateString("en-IN")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
