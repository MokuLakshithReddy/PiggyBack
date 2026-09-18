"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getShipments, createShipment, searchShipments, getTrucks, assignShipmentToTruck } from "@/lib/store";
import { stateManager } from "@/lib/engine/state-manager";
import type { StaffShipment } from "@/lib/engine/types";
import { CITIES } from "@/types";
import { Search, Plus, X, Package, ArrowRight, Zap, ShieldAlert } from "lucide-react";

export default function ShipmentsPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<StaffShipment[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [solvingId, setSolvingId] = useState<string | null>(null);

  const loadData = () => {
    setShipments(stateManager.getShipments());
  };

  useEffect(() => {
    loadData();
    const unsub = stateManager.subscribe(loadData);
    return unsub;
  }, []);

  useEffect(() => {
    if (!query) {
      setShipments(stateManager.getShipments());
    } else {
      setShipments(searchShipments(query));
    }
  }, [query]);

  // Create form state
  const [form, setForm] = useState({
    origin: "Hyderabad",
    destination: "Chennai",
    priority: "Medium" as StaffShipment["priority"],
    weight: "",
    volume: "",
    deadline: "",
    cargoDescription: "",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(form.weight);
    const v = parseFloat(form.volume);
    if (!w || !v || !form.deadline || !form.cargoDescription.trim()) return;

    createShipment({
      origin: form.origin,
      destination: form.destination,
      priority: form.priority,
      weight: w,
      volume: v,
      deadline: form.deadline,
      cargoDescription: form.cargoDescription,
    });

    setShipments(stateManager.getShipments());
    setShowCreate(false);
    setForm({
      origin: "Hyderabad",
      destination: "Chennai",
      priority: "Medium",
      weight: "",
      volume: "",
      deadline: "",
      cargoDescription: "",
    });
    setSuccess("Shipment created successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleAssign = (truckId: string) => {
    if (!showAssign) return;
    assignShipmentToTruck(showAssign, truckId);
    setShipments(stateManager.getShipments());
    setShowAssign(null);
    setSuccess("Shipment assigned successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleSolveRecovery = (id: string) => {
    setSolvingId(id);
    setTimeout(() => {
      try {
        stateManager.solveRecovery(id);
        router.push(`/staff/recovery/${id}`);
      } catch (e) {
        console.error(e);
        setSolvingId(null);
      }
    }, 350);
  };

  const filteredShipments = shipments.filter((s) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "DISRUPTED") {
      return s.status === "Misplaced" || s.status === "Delayed" || s.status === "Pending";
    }
    return s.status.toUpperCase() === statusFilter;
  });

  const trucks = getTrucks().filter((t) => t.status === "Available");

  return (
    <div className="p-6 md:p-10 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Shipments Ledger</h1>
          <p className="text-sm text-muted mt-1">{shipments.length} total monitored consignments</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Shipment
        </button>
      </div>

      {success && (
        <div className="mb-6 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm font-medium">
          {success}
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "ALL", label: "All Shipments" },
            { id: "DISRUPTED", label: "Disrupted / Misplaced" },
            { id: "IN TRANSIT", label: "In Transit" },
            { id: "RECOVERY FOUND", label: "Recovery Found" },
            { id: "RECOVERED", label: "Recovered" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? "bg-foreground text-background"
                  : "bg-surface border border-border text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shipments, code, cargo..."
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Shipments Table */}
      <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-surface/50 font-mono text-muted text-[10px] tracking-wider uppercase">
              <th className="text-left px-5 py-3">SHIPMENT ID</th>
              <th className="text-left px-5 py-3">CARGO</th>
              <th className="text-left px-5 py-3">CORRIDOR</th>
              <th className="text-left px-5 py-3">LOCATION</th>
              <th className="text-left px-5 py-3">PRIORITY</th>
              <th className="text-left px-5 py-3">STATUS</th>
              <th className="text-left px-5 py-3">CARRIER</th>
              <th className="text-right px-5 py-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredShipments.map((s) => {
              const isDisrupted = s.status === "Misplaced" || s.status === "Delayed";

              return (
                <tr
                  key={s.id}
                  className={`border-b border-border/50 hover:bg-background/50 transition-colors ${
                    isDisrupted ? "bg-rose-500/[0.03]" : ""
                  }`}
                >
                  <td className="px-5 py-4">
                    <p className="font-mono font-bold text-xs text-foreground">{s.id}</p>
                    <p className="font-mono text-[10px] text-muted">{s.code}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-muted">{s.cargoId}</td>
                  <td className="px-5 py-4">
                    {s.origin} → {s.destination}
                  </td>
                  <td className="px-5 py-4 font-medium">
                    <span className={isDisrupted ? "text-rose-400 font-semibold" : "text-foreground"}>
                      {s.currentLocation}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`font-semibold ${
                        s.priority === "High"
                          ? "text-rose-400"
                          : s.priority === "Medium"
                          ? "text-amber-400"
                          : "text-muted"
                      }`}
                    >
                      {s.priority}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider ${
                        s.status === "Recovered" || s.status === "Recovery Found"
                          ? "status-recovered"
                          : isDisrupted
                          ? "status-misplaced"
                          : s.status === "In Transit"
                          ? "status-transit"
                          : s.status === "Assigned"
                          ? "status-assigned"
                          : "status-pending"
                      }`}
                    >
                      {s.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-muted">{s.assignedTruck ?? "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isDisrupted ? (
                        <>
                          <Link
                            href={`/staff/incident/${s.id}`}
                            className="px-2.5 py-1 text-xs text-muted hover:text-foreground font-medium rounded-lg border border-border/80 hover:bg-surface transition-colors"
                          >
                            Incident
                          </Link>
                          <button
                            onClick={() => handleSolveRecovery(s.id)}
                            disabled={solvingId === s.id}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-accent text-white hover:bg-accent/90 transition-all shadow-sm disabled:opacity-50"
                          >
                            <Zap className="w-3 h-3" />
                            {solvingId === s.id ? "Solving..." : "MOSAIC"}
                          </button>
                        </>
                      ) : s.status === "Recovery Found" ? (
                        <Link
                          href={`/staff/recovery/${s.id}`}
                          className="px-2.5 py-1 text-xs text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10 transition-colors font-medium"
                        >
                          View Plan
                        </Link>
                      ) : !s.assignedTruck ? (
                        <button
                          onClick={() => setShowAssign(s.id)}
                          className="text-xs text-accent hover:text-foreground transition-colors font-semibold"
                        >
                          Assign Truck
                        </button>
                      ) : (
                        <Link
                          href={`/track?id=${s.id}`}
                          className="text-xs text-muted hover:text-foreground transition-colors"
                        >
                          Track
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {filteredShipments.map((s) => {
          const isDisrupted = s.status === "Misplaced" || s.status === "Delayed";
          return (
            <div
              key={s.id}
              className={`bg-surface border rounded-2xl p-4 shadow-sm ${
                isDisrupted ? "border-rose-500/40" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-accent" />
                  <span className="font-mono text-xs font-bold text-foreground">{s.id}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    isDisrupted ? "bg-rose-500/15 text-rose-400" : "bg-emerald-500/15 text-emerald-400"
                  }`}
                >
                  {s.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted mb-2">
                {s.origin} → {s.destination} · Stranded @ <strong className="text-foreground">{s.currentLocation}</strong>
              </p>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                <span className="text-muted">{s.weight} kg · {s.priority}</span>
                {isDisrupted && (
                  <button
                    onClick={() => handleSolveRecovery(s.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-accent text-white font-bold"
                  >
                    <Zap className="w-3 h-3" /> Solve
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-background border border-border rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Register New Consignment</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">ORIGIN</label>
                  <select
                    value={form.origin}
                    onChange={(e) => setForm({ ...form, origin: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">DESTINATION</label>
                  <select
                    value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">PRIORITY</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as StaffShipment["priority"] })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High (Strict SLA)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">WEIGHT (kg)</label>
                  <input
                    type="number"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="42"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">VOLUME (m³)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.volume}
                    onChange={(e) => setForm({ ...form, volume: e.target.value })}
                    placeholder="0.8"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">DEADLINE</label>
                <input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-muted tracking-wider block mb-1">CARGO DESCRIPTION</label>
                <input
                  type="text"
                  value={form.cargoDescription}
                  onChange={(e) => setForm({ ...form, cargoDescription: e.target.value })}
                  placeholder="Automotive Inverters / Medical Supplies"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-foreground text-background py-3 rounded-xl font-bold hover:bg-accent transition-colors mt-2"
              >
                Register Consignment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAssign(null)}>
          <div className="bg-background border border-border rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Assign Scheduled Carrier</h2>
              <button onClick={() => setShowAssign(null)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted mb-4">
              Select an available truck with spare volume for <span className="font-mono font-bold text-foreground">{showAssign}</span>
            </p>
            {trucks.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">No trucks currently available.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {trucks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleAssign(t.id)}
                    className="w-full flex items-center justify-between bg-surface border border-border rounded-xl p-3.5 hover:border-accent transition-colors text-left"
                  >
                    <div>
                      <p className="font-mono text-xs font-bold">{t.numberPlate}</p>
                      <p className="text-[11px] text-muted">{t.driverName} · {t.destination}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-accent font-bold">{t.availableCapacity} kg</p>
                      <ArrowRight className="w-3.5 h-3.5 text-muted ml-auto mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
