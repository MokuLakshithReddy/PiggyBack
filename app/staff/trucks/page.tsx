"use client";

import { useEffect, useState } from "react";
import { getTrucks, createTruck } from "@/lib/store";
import type { Truck } from "@/types";
import { CITIES } from "@/types";
import { Plus, X, Truck as TruckIcon } from "lucide-react";

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTrucks(getTrucks());
  }, []);

  const [form, setForm] = useState({
    numberPlate: "", driverName: "", driverMobile: "",
    copassengerName: "", copassengerMobile: "",
    destination: "Chennai", currentLocation: "Hyderabad",
    capacity: "", availableCapacity: "",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cap = parseFloat(form.capacity);
    const avail = parseFloat(form.availableCapacity);
    if (!form.numberPlate.trim() || !form.driverName.trim() || !cap) return;

    createTruck({
      numberPlate: form.numberPlate.toUpperCase().trim(),
      driverName: form.driverName.trim(),
      driverMobile: form.driverMobile.trim() || "+91 XXXXX XXXXX",
      copassengerName: form.copassengerName.trim() || "—",
      copassengerMobile: form.copassengerMobile.trim() || "—",
      destination: form.destination,
      currentLocation: form.currentLocation,
      capacity: cap,
      availableCapacity: avail || cap,
    });

    setTrucks(getTrucks());
    setShowCreate(false);
    setForm({ numberPlate: "", driverName: "", driverMobile: "", copassengerName: "", copassengerMobile: "", destination: "Chennai", currentLocation: "Hyderabad", capacity: "", availableCapacity: "" });
    setSuccess("Truck added successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight">Trucks</h1>
          <p className="text-sm text-muted mt-1">{trucks.length} trucks registered</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-accent transition-colors">
          <Plus className="w-4 h-4" /> Add Truck
        </button>
      </div>

      {success && (
        <div className="mb-6 bg-success/10 text-success border border-success/20 rounded-xl px-4 py-3 text-sm font-medium">{success}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trucks.map(t => (
          <div key={t.id} className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-foreground/5 rounded-xl flex items-center justify-center">
                  <TruckIcon className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-mono text-sm font-bold">{t.numberPlate}</p>
                  <p className="font-mono text-[10px] text-muted">{t.id}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider ${
                t.status === "Available" ? "status-recovered" :
                t.status === "In Transit" ? "status-transit" :
                t.status === "Assigned" ? "status-assigned" : "status-pending"
              }`}>{t.status.toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs mb-4">
              <div>
                <p className="font-mono text-[10px] text-muted tracking-wider mb-0.5">DRIVER</p>
                <p className="font-medium">{t.driverName}</p>
                <p className="text-muted">{t.driverMobile}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-muted tracking-wider mb-0.5">CO-PASSENGER</p>
                <p className="font-medium">{t.copassengerName}</p>
                <p className="text-muted">{t.copassengerMobile}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50 grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="font-mono text-[10px] text-muted tracking-wider mb-0.5">DESTINATION</p>
                <p className="font-medium">{t.destination}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-muted tracking-wider mb-0.5">CAPACITY</p>
                <p className="font-medium">{t.capacity} kg</p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-muted tracking-wider mb-0.5">AVAILABLE</p>
                <p className="font-medium text-accent">{t.availableCapacity} kg</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-background border border-border rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">Add Truck</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">TRUCK NUMBER PLATE</label>
                <input type="text" value={form.numberPlate} onChange={e => setForm({...form, numberPlate: e.target.value})} placeholder="TS 09 AB 2048" className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">DRIVER NAME</label>
                  <input type="text" value={form.driverName} onChange={e => setForm({...form, driverName: e.target.value})} placeholder="Ravi Kumar" className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">DRIVER MOBILE</label>
                  <input type="tel" value={form.driverMobile} onChange={e => setForm({...form, driverMobile: e.target.value})} placeholder="+91 98765 43210" className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">CO-PASSENGER NAME</label>
                  <input type="text" value={form.copassengerName} onChange={e => setForm({...form, copassengerName: e.target.value})} placeholder="Arjun Rao" className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">CO-PASSENGER MOBILE</label>
                  <input type="tel" value={form.copassengerMobile} onChange={e => setForm({...form, copassengerMobile: e.target.value})} placeholder="+91 98765 43211" className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">CURRENT LOCATION</label>
                  <select value={form.currentLocation} onChange={e => setForm({...form, currentLocation: e.target.value})} className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">TOTAL CAPACITY (kg)</label>
                  <input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} placeholder="500" className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">AVAILABLE (kg)</label>
                  <input type="number" value={form.availableCapacity} onChange={e => setForm({...form, availableCapacity: e.target.value})} placeholder="120" className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
              </div>
              <button type="submit" className="w-full bg-foreground text-background py-3 rounded-xl font-medium hover:bg-accent transition-colors mt-2">
                Add Truck
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
