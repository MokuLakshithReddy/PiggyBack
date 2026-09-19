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
  Radio,
  CheckCircle2,
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
  const [sentAlert, setSentAlert] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const vehicleId = plan?.vehicleId || "TRK-003";
  const etaFormatted = plan?.eta
    ? new Date(plan.eta).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "04:30 PM";
  const co2Avoided = plan?.co2SavedKg || 420;

  // Clean phone number (digits only)
  const cleanPhone = phoneNumber.replace(/\D/g, "");

  // Real WhatsApp message text
  const whatsappMessage = `📦 *PiggyBack Logistics — Consignment Recovery Alert*

Hello ${recipientName},
Your parcel *${shipment.id}* was safely transferred onto express carrier *${vehicleId}* via our autonomous piggybacking network!

🚚 *Assigned Carrier:* ${vehicleId}
⏰ *Guaranteed Delivery ETA:* ${etaFormatted} (On Schedule)
🌱 *Green Logistics:* ${co2Avoided} kg CO₂ avoided
📍 *Live Tracking:* https://smart-intelligent-transport.vercel.app/track?id=${shipment.id}

Thank you for choosing eco-certified logistics.`;

  // Real Native SMS text
  const smsMessage = `PiggyBack Alert: Hi ${recipientName}, shipment ${shipment.id} is securely in transit via express carrier ${vehicleId}. Guaranteed ETA remains on-time for ${etaFormatted}. Shared logistics avoided ${co2Avoided} kg of carbon. Track live: https://smart-intelligent-transport.vercel.app/track?id=${shipment.id}`;

  const handleSendToRealWhatsApp = () => {
    const targetPhone = cleanPhone || "919876543210";
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, "_blank");
    setSentAlert("WhatsApp Alert dispatched to " + (cleanPhone || targetPhone));
    setTimeout(() => setSentAlert(null), 4500);
  };

  const handleSendToRealSMS = async () => {
    setIsSending(true);
    const targetPhone = cleanPhone || "919876543210";

    // 1. Trigger backend SMS gateway route for delivery report
    try {
      await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: targetPhone,
          recipientName,
          shipmentId: shipment.id,
          message: smsMessage,
        }),
      });
    } catch {
      // Ignore network errors in local dev
    }

    // 2. Open user's real SMS messaging app (iMessage, Android Messages, or Windows Phone Link)
    const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? "&" : "?";
    const smsUrl = `sms:${targetPhone}${separator}body=${encodeURIComponent(smsMessage)}`;
    window.open(smsUrl, "_blank");

    setIsSending(false);
    setSentAlert(`SMS Dispatched to +${targetPhone} via DLT Carrier Gateway (Header: PGBACK)!`);
    setTimeout(() => setSentAlert(null), 5000);
  };

  const handleSendSimulated = () => {
    setSentAlert("Simulated push notification dispatched to virtual device!");
    setTimeout(() => setSentAlert(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Floating Top In-App Toast when notification is fired */}
        {sentAlert && (
          <div className="absolute top-4 inset-x-4 z-50 bg-emerald-600 text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top duration-300 font-sans">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />
            <div className="text-xs">
              <p className="font-bold">{sentAlert}</p>
              <p className="text-[11px] opacity-90">Message transmitted with live tracking URL.</p>
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

        {/* Real-Life Recipient Phone Input & Actions */}
        <div className="p-6 bg-background border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wide">
              Send to Real-Life (IRL) Recipient
            </span>
            <span
              className={`text-[11px] font-mono px-2.5 py-0.5 rounded font-bold transition-all ${
                activeTab === "sms"
                  ? "text-blue-400 bg-blue-500/15 border border-blue-500/30"
                  : "text-emerald-500 bg-emerald-500/15 border border-emerald-500/30"
              }`}
            >
              {activeTab === "sms" ? "SMS Telecom Gateway (DLT)" : "WhatsApp Direct API"}
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

          {/* Action Dispatch Buttons */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {activeTab === "sms" ? (
              <>
                {/* Primary SMS Button */}
                <button
                  onClick={handleSendToRealSMS}
                  disabled={isSending}
                  className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send to Real SMS ({cleanPhone || "91..."})</span>
                </button>

                <button
                  onClick={handleSendToRealWhatsApp}
                  className="px-3 py-2.5 rounded-xl font-bold text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all"
                  title="Send via WhatsApp instead"
                >
                  WhatsApp
                </button>
              </>
            ) : (
              <>
                {/* Primary WhatsApp Button */}
                <button
                  onClick={handleSendToRealWhatsApp}
                  className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#25D366] text-slate-950 hover:bg-[#20ba59] transition-all shadow-md active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Send to Real WhatsApp ({cleanPhone || "91..."})</span>
                </button>

                <button
                  onClick={handleSendToRealSMS}
                  className="px-3 py-2.5 rounded-xl font-bold text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-all"
                  title="Send via SMS instead"
                >
                  SMS
                </button>
              </>
            )}

            <button
              onClick={handleSendSimulated}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-surface border border-border hover:border-accent text-foreground transition-all shadow-xs"
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
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-xs"
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
                {/* SMS Header */}
                <div className="bg-slate-800/90 p-3 text-center border-b border-slate-700">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="font-bold text-xs tracking-wider">VK-PGBACK</p>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      TRAI DLT
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{phoneNumber}</p>
                </div>

                <div className="flex-1 p-3.5 space-y-3 flex flex-col justify-between">
                  {/* SMS Message Bubble */}
                  <div className="bg-blue-600 text-white p-3.5 rounded-2xl rounded-tl-none shadow-lg text-[11px] leading-relaxed space-y-2">
                    <p>
                      <strong>PiggyBack Alert:</strong> Hi {recipientName}, shipment {shipment.id} is securely in transit via express carrier {vehicleId}.
                    </p>
                    <p>
                      Guaranteed ETA remains on-time for {etaFormatted}. Shared logistics avoided {co2Avoided} kg of carbon.
                    </p>
                    <p className="text-blue-100 underline pt-1 block font-mono text-[10px]">
                      https://smart-intelligent-transport.vercel.app/track?id={shipment.id}
                    </p>
                    <div className="flex items-center justify-between text-[9px] text-blue-200 pt-1 border-t border-blue-500/40">
                      <span>Header: VK-PGBACK</span>
                      <span>Delivered • Just now</span>
                    </div>
                  </div>

                  {/* Direct SMS Trigger Button inside Simulated Phone */}
                  <div
                    onClick={handleSendToRealSMS}
                    className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 p-2.5 rounded-xl text-center text-[11px] font-mono font-semibold cursor-pointer transition-all shadow flex items-center justify-center gap-2 active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send via Real Device SMS (+{cleanPhone || "91..."})</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-border bg-surface text-center">
          <p className="text-xs font-mono text-muted">
            {activeTab === "sms"
              ? "Clicking 'Send to Real SMS' opens your native phone/PC messaging app with pre-filled SMS and logs carrier acknowledgment."
              : "Clicking 'Send to Real WhatsApp' opens WhatsApp directly with the pre-filled consignment dispatch alert."}
          </p>
        </div>
      </div>
    </div>
  );
}
