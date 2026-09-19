"use client";

import React, { useState } from "react";
import { X, Send, CheckCheck, Smartphone, MessageSquare, Bell, Sparkles, ShieldCheck } from "lucide-react";
import { RecoveryPlan, StaffShipment } from "@/lib/engine/types";

interface CustomerNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: StaffShipment;
  plan?: RecoveryPlan | null;
}

export function CustomerNotificationModal({
  isOpen,
  onClose,
  shipment,
  plan,
}: CustomerNotificationModalProps) {
  const [activeTab, setActiveTab] = useState<"whatsapp" | "sms">("whatsapp");
  const [sentAlert, setSentAlert] = useState(false);

  if (!isOpen) return null;

  const vehicleId = plan?.vehicleId || "TRK-003";
  const etaFormatted = plan?.eta
    ? new Date(plan.eta).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "04:30 PM";
  const co2Avoided = plan?.co2SavedKg || 420;

  const handleSendSimulated = () => {
    setSentAlert(true);
    setTimeout(() => {
      setSentAlert(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-background border border-border rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Floating Top In-App Toast when notification is sent */}
        {sentAlert && (
          <div className="absolute top-4 inset-x-4 z-50 bg-emerald-500 text-black p-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top duration-300 font-sans">
            <Bell className="w-5 h-5 shrink-0" />
            <div className="text-xs">
              <p className="font-bold">Automated Dispatch Alert Triggered!</p>
              <p className="text-[11px] opacity-90">Simulated WhatsApp push message dispatched to recipient.</p>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-accent" />
            <span className="font-semibold text-sm">Customer Transparency Simulator</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Channel Selector */}
        <div className="p-4 bg-surface/40 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-background p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab("whatsapp")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "whatsapp"
                  ? "bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40 shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              WhatsApp Business
            </button>
            <button
              onClick={() => setActiveTab("sms")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "sms"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              SMS Gateway
            </button>
          </div>

          <button
            onClick={handleSendSimulated}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-accent text-white hover:bg-accent/90 transition-all shadow-sm shrink-0"
          >
            <Send className="w-3 h-3" /> Test Push
          </button>
        </div>

        {/* Simulated Smartphone Screen */}
        <div className="p-6 bg-gradient-to-b from-surface/50 to-background flex justify-center">
          <div className="w-[320px] rounded-[36px] border-4 border-slate-700 bg-black p-3 shadow-2xl relative overflow-hidden font-sans">
            {/* Phone Notch */}
            <div className="w-24 h-4 bg-slate-800 mx-auto rounded-b-xl mb-2 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-900" />
            </div>

            {/* Simulated WhatsApp App View */}
            {activeTab === "whatsapp" ? (
              <div className="bg-[#0b141a] text-white rounded-2xl overflow-hidden text-xs flex flex-col h-[400px]">
                {/* WhatsApp Chat Header */}
                <div className="bg-[#202c33] p-3 flex items-center gap-2.5 border-b border-[#2a3942]">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-black text-xs shrink-0">
                    PB
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs flex items-center gap-1 text-white truncate">
                      PiggyBack Logistics
                      <ShieldCheck className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                    </p>
                    <p className="text-[10px] text-emerald-400 font-mono">Official Verified Business</p>
                  </div>
                </div>

                {/* WhatsApp Chat Body */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[radial-gradient(#202c33_1px,transparent_1px)] [background-size:16px_16px]">
                  {/* Incoming PiggyBack Automated Alert */}
                  <div className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tl-none shadow-md space-y-2 max-w-[95%]">
                    <p className="text-[11px] font-bold text-emerald-300">
                      📦 Delivery On-Schedule Update
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-100">
                      Hi Rahul, your parcel <strong className="font-mono text-white">{shipment.id}</strong> faced a brief corridor detour, but our autonomous system has safely transferred it onto express carrier <strong className="font-mono text-emerald-200">{vehicleId}</strong>!
                    </p>

                    <div className="bg-[#025142] p-2 rounded-xl text-[10px] space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-300">New Carrier:</span>
                        <span className="font-bold text-white">{vehicleId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Guaranteed ETA:</span>
                        <span className="font-bold text-emerald-300">{etaFormatted} (On Time)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Eco Savings:</span>
                        <span className="text-emerald-300">🌱 {co2Avoided} kg CO₂ saved</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-300 pt-1 border-t border-[#025142]">
                      <span>Autonomous PiggyBack Alert</span>
                      <span className="flex items-center gap-1 text-sky-400">
                        11:42 AM <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                      </span>
                    </div>
                  </div>

                  {/* Interactive Button in WhatsApp */}
                  <div className="bg-[#202c33] hover:bg-[#2a3942] p-2 rounded-xl text-center text-[11px] font-semibold text-emerald-400 border border-[#2a3942] cursor-pointer transition-colors shadow-sm">
                    📍 Track Live Location &rarr;
                  </div>
                </div>
              </div>
            ) : (
              /* Simulated Native SMS Screen */
              <div className="bg-slate-900 text-white rounded-2xl overflow-hidden text-xs flex flex-col h-[400px]">
                <div className="bg-slate-800/80 p-3 text-center border-b border-slate-700">
                  <p className="font-bold text-xs">PIGGYBACK-SMS</p>
                  <p className="text-[10px] text-muted font-mono">+91 1800-PIGGYBACK</p>
                </div>

                <div className="flex-1 p-3 space-y-3">
                  <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tl-none shadow-md text-[11px] leading-relaxed space-y-1">
                    <p>
                      <strong>PiggyBack Alert:</strong> Shipment {shipment.id} is securely in transit via express carrier {vehicleId}.
                    </p>
                    <p>
                      Guaranteed ETA remains on-time for {etaFormatted}. Shared logistics avoided {co2Avoided} kg of carbon.
                    </p>
                    <p className="text-blue-200 underline pt-1 block font-mono">
                      https://piggyback.network/t/{shipment.id}
                    </p>
                    <span className="text-[9px] text-blue-200 block text-right">Delivered &bull; Just now</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-border bg-surface text-center">
          <p className="text-[11px] font-mono text-muted">
            Automated customer notification dispatched instantly upon recovery plan approval.
          </p>
        </div>
      </div>
    </div>
  );
}
