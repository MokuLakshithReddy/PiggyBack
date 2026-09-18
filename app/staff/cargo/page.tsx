"use client";

import { useEffect, useState } from "react";
import { getCargo, createCargo } from "@/lib/store";
import type { Cargo } from "@/types";
import { CITIES } from "@/types";
import { Plus, X, Box } from "lucide-react";

export default function CargoPage() {
  const [cargo, setCargo] = useState<Cargo[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargo(getCargo());
  }, []);

  const [form, setForm] = useState({
    shipmentId: "", description: "", weight: "", volume: "",
    origin: "Hyderabad", destination: "Chennai", priority: "Medium" as Cargo["priority"],
    specialHandling: "None",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(form.weight);
    const v = parseFloat(form.volume);
    if (!w || !v || !form.description.trim()) return;

    createCargo({
      shipmentId: form.shipmentId || "—", description: form.description,
      weight: w, volume: v, origin: form.origin, destination: form.destination,
      priority: form.priority, specialHandling: form.specialHandling, status: "Pending",
    });

    setCargo(getCargo());
    setShowCreate(false);
    setForm({ shipmentId: "", description: "", weight: "", volume: "", origin: "Hyderabad", destination: "Chennai", priority: "Medium", specialHandling: "None" });
    setSuccess("Cargo created successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight">Cargo</h1>
          <p className="text-sm text-muted mt-1">{cargo.length} cargo records</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-accent transition-colors">
          <Plus className="w-4 h-4" /> Add Cargo
        </button>
      </div>

      {success && (
        <div className="mb-6 bg-success/10 text-success border border-success/20 rounded-xl px-4 py-3 text-sm font-medium">{success}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cargo.map(c => (
          <div key={c.id} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Box className="w-5 h-5 text-accent" strokeWidth={1.5} />
              <div>
                <p className="font-mono text-sm font-bold">{c.id}</p>
                <p className="font-mono text-[10px] text-muted">Shipment: {c.shipmentId}</p>
              </div>
            </div>
            <p className="text-sm font-medium mb-3">{c.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted">
              <span>{c.weight} kg</span>
              <span>{c.volume} m³</span>
              <span>{c.origin} → {c.destination}</span>
              <span>{c.specialHandling}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider ${
                c.status === "Delivered" ? "status-recovered" : c.status === "In Transit" ? "status-transit" : "status-pending"
              }`}>{c.status.toUpperCase()}</span>
              <span className={`text-xs font-medium ${c.priority === "High" ? "text-accent" : "text-muted"}`}>{c.priority}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-background border border-border rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">Add Cargo</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">DESCRIPTION</label>
                <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Consumer Electronics" className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">WEIGHT (kg)</label>
                  <input type="number" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">VOLUME (m³)</label>
                  <input type="number" step="0.1" value={form.volume} onChange={e => setForm({...form, volume: e.target.value})} className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">ORIGIN</label>
                  <select value={form.origin} onChange={e => setForm({...form, origin: e.target.value})} className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">DESTINATION</label>
                  <select value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">SPECIAL HANDLING</label>
                <select value={form.specialHandling} onChange={e => setForm({...form, specialHandling: e.target.value})} className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                  <option value="None">None</option>
                  <option value="Fragile">Fragile</option>
                  <option value="Temperature Controlled">Temperature Controlled</option>
                  <option value="Hazardous">Hazardous</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-foreground text-background py-3 rounded-xl font-medium hover:bg-accent transition-colors mt-2">
                Add Cargo
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
