"use client";

import React, { useState } from "react";
import {
  X,
  Send,
  CheckCheck,
  Smartphone,
  MessageSquare,
  Bell,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Phone,
} from "lucide-react";
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
  const [phoneNumber, setPhoneNumber] = useState("+91 98765 43210");
  const [recipientName, setRecipientName] = useState("Rahul");
  const [sentAlert, setSentAlert] = useState(false);

  if (!isOpen) return null;

  const vehicleId = plan?.vehicleId || "TRK-003";
  const etaFormatted = plan?.eta
    ? new Date(plan.eta).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "04:30 PM";
  const co2Avoided = plan?.co2SavedKg || 420;

  // Clean phone number for wa.me link (digits only, e.g. 919876543210)
  const cleanPhone = phoneNumber.replace(/\D/g, "");

  // Real WhatsApp message text
  const whatsappMessage = `📦 *PiggyBack Logistics — Consignment Recovery Alert*

Hello ${recipientName},
Your parcel *${shipment.id}* was safely transferred onto express carrier *${vehicleId}* via our autonomous piggybacking network!

🚚 *Assigned Carrier:* ${vehicleId}
⏰ *Guaranteed Delivery ETA:* ${etaFormatted} (On Schedule)
🌱 *Green Logistics:* ${co2Avoided} kg CO₂ avoided
📍 *Live Tracking:* http://localhost:3000/track?id=${shipment.id}

Thank you for choosing eco-certified logistics.`;

  const handleSendToRealWhatsApp = () => {
    const targetPhone = cleanPhone || "919876543210";
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, "_blank");
  };

  const handleSendSimulated = () => {
    setSentAlert(true);
    setTimeout(() => {
      setSentAlert(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Floating Top In-App Toast when simulated alert is fired */}
        {sentAlert && (
          <div className="absolute top-4 inset-x-4 z-50 bg-emerald-600 text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top duration-300 font-sans">
            <Bell className="w-5 h-5 shrink-0" />
            <div className="text-xs">
              <p className="font-bold">Simulated Notification Dispatched!</p>
              <p className="text-[11px] opacity-90">In-app push preview updated on simulated phone below.</p>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-accent uppercase tracking-wider mb-0.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Customer Dispatch Automation</span>
            </div>
            <h3 className="font-bold text-base text-foreground">
              WhatsApp &amp; SMS Dispatch Gateway
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real-Life Recipient Phone Input & Direct WhatsApp Action */}
        <div className="p-6 bg-background border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wide">
              Send to Real-Life (IRL) Recipient
            </span>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
              WhatsApp Direct API
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono font-semibold text-muted block mb-1">
                Recipient Name
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono font-semibold text-muted block mb-1">
                Real Phone Number (with country code)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-8 pr-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={handleSendToRealWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#25D366] text-slate-950 hover:bg-[#20ba59] transition-all shadow-md active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              Send to Real WhatsApp ({cleanPhone || "91..."})
            </button>

            <button
              onClick={handleSendSimulated}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-surface border border-border hover:border-accent text-foreground transition-all shadow-xs"
            >
              Simulate In-App
            </button>
          </div>
        </div>

        {/* Channel Selector */}
        <div className="px-6 py-3 bg-surface border-b border-border flex items-center justify-between">
          <span className="text-xs text-muted font-medium">Interactive Preview Mode:</span>
          <div className="flex items-center gap-1.5 bg-background p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab("whatsapp")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === "whatsapp"
                  ? "bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/40 shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              WhatsApp Business
            </button>
            <button
              onClick={() => setActiveTab("sms")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === "sms"
                  ? "bg-blue-500/20 text-blue-600 border border-blue-500/40 shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              SMS Gateway
            </button>
          </div>
        </div>

        {/* Smartphone Bezel */}
        <div className="p-6 bg-gradient-to-b from-background to-surface flex justify-center">
          <div className="w-[340px] rounded-[36px] border-4 border-slate-700 bg-black p-3 shadow-2xl relative overflow-hidden font-sans">
            {/* Phone Notch */}
            <div className="w-24 h-4 bg-slate-800 mx-auto rounded-b-xl mb-2 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-900" />
            </div>

            {/* WhatsApp App View */}
            {activeTab === "whatsapp" ? (
              <div className="bg-[#0b141a] text-white rounded-2xl overflow-hidden text-xs flex flex-col h-[380px]">
                {/* Chat Header */}
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

                {/* Chat Body */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[radial-gradient(#202c33_1px,transparent_1px)] [background-size:16px_16px]">
                  {/* Incoming PiggyBack Alert */}
                  <div className="bg-[#005c4b] text-white p-3.5 rounded-2xl rounded-tl-none shadow-md space-y-2.5 max-w-[95%]">
                    <p className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                      <span>📦 Consignment Recovery Alert</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-100">
                      Hi {recipientName}, your parcel <strong className="font-mono text-white">{shipment.id}</strong> was transferred onto express carrier <strong className="font-mono text-emerald-200">{vehicleId}</strong> via our autonomous piggybacking network!
                    </p>

                    <div className="bg-[#025142] p-2.5 rounded-xl text-[10px] space-y-1.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Carrier:</span>
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
                      <span>Autonomous PiggyBack Network</span>
                      <span className="flex items-center gap-1 text-sky-400">
                        Just now <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                      </span>
                    </div>
                  </div>

                  {/* Interactive Button */}
                  <div
                    onClick={handleSendToRealWhatsApp}
                    className="bg-[#202c33] hover:bg-[#2a3942] p-2.5 rounded-xl text-center text-[11px] font-semibold text-emerald-400 border border-[#2a3942] cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>📍 Open in Real WhatsApp ({phoneNumber})</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Native SMS View */
              <div className="bg-slate-900 text-white rounded-2xl overflow-hidden text-xs flex flex-col h-[380px]">
                <div className="bg-slate-800/80 p-3 text-center border-b border-slate-700">
                  <p className="font-bold text-xs">PIGGYBACK-SMS</p>
                  <p className="text-[10px] text-muted font-mono">{phoneNumber}</p>
                </div>

                <div className="flex-1 p-3.5 space-y-3">
                  <div className="bg-blue-600 text-white p-3.5 rounded-2xl rounded-tl-none shadow-md text-[11px] leading-relaxed space-y-1.5">
                    <p>
                      <strong>PiggyBack Alert:</strong> Hi {recipientName}, shipment {shipment.id} is securely in transit via express carrier {vehicleId}.
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
          <p className="text-xs font-mono text-muted">
            Clicking &quot;Send to Real WhatsApp&quot; opens WhatsApp directly with the pre-filled consignment dispatch alert.
          </p>
        </div>
      </div>
    </div>
  );
}
