"use client";

import React, { useState } from "react";
import { Box, Layers, Maximize2, ShieldCheck, Truck as TruckIcon, Info, Sparkles, CheckCircle2 } from "lucide-react";

interface CargoItem {
  id: string;
  name: string;
  category: string;
  weightKg: number;
  volumeM3: number;
  fragility: "Standard" | "Fragile" | "Perishable";
  isPiggyback: boolean;
  color: string;
  gridSpan: { col: number; row: number; width: number; height: number };
}

interface CargoBayVisualizerProps {
  vehicleId: string;
  shipmentId: string;
  shipmentWeight?: number;
  shipmentVolume?: number;
  shipmentCategory?: string;
  vehicleCapacityKg?: number;
  vehicleTotalVolumeM3?: number;
}

export function CargoBayVisualizer({
  vehicleId,
  shipmentId,
  shipmentWeight = 650,
  shipmentVolume = 4.2,
  shipmentCategory = "Medical Equipment",
  vehicleCapacityKg = 6000,
  vehicleTotalVolumeM3 = 24,
}: CargoBayVisualizerProps) {
  const [showPiggyback, setShowPiggyback] = useState(true);
  const [selectedCargo, setSelectedCargo] = useState<CargoItem | null>(null);

  // Baseline cargo inside the truck
  const baselineCargos: CargoItem[] = [
    {
      id: "PKG-BASE-01",
      name: "Commercial Electronics",
      category: "High-Value Tech",
      weightKg: 1850,
      volumeM3: 6.8,
      fragility: "Fragile",
      isPiggyback: false,
      color: "from-blue-600/30 to-indigo-600/40 border-blue-500/50 text-blue-300",
      gridSpan: { col: 1, row: 1, width: 3, height: 2 },
    },
    {
      id: "PKG-BASE-02",
      name: "Textile & Garment Bundles",
      category: "Dry Freight",
      weightKg: 1400,
      volumeM3: 5.5,
      fragility: "Standard",
      isPiggyback: false,
      color: "from-slate-600/30 to-slate-700/40 border-slate-500/50 text-slate-300",
      gridSpan: { col: 4, row: 1, width: 3, height: 2 },
    },
    {
      id: "PKG-BASE-03",
      name: "Industrial Machine Bearings",
      category: "Heavy Hardware",
      weightKg: 850,
      volumeM3: 2.2,
      fragility: "Standard",
      isPiggyback: false,
      color: "from-cyan-600/30 to-teal-700/40 border-cyan-500/50 text-cyan-300",
      gridSpan: { col: 1, row: 3, width: 2, height: 2 },
    },
  ];

  const piggybackCargo: CargoItem = {
    id: shipmentId,
    name: `Piggybacked: ${shipmentCategory}`,
    category: "Recovered Consignment",
    weightKg: shipmentWeight,
    volumeM3: shipmentVolume,
    fragility: "Fragile",
    isPiggyback: true,
    color: "from-emerald-500/30 to-emerald-600/50 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20",
    gridSpan: { col: 3, row: 3, width: 4, height: 2 },
  };

  const activeCargos = showPiggyback ? [...baselineCargos, piggybackCargo] : baselineCargos;

  const totalLoadedWeight = activeCargos.reduce((sum, c) => sum + c.weightKg, 0);
  const totalLoadedVolume = activeCargos.reduce((sum, c) => sum + c.volumeM3, 0);

  const weightPercent = Math.min(100, Math.round((totalLoadedWeight / vehicleCapacityKg) * 100));
  const volumePercent = Math.min(100, Math.round((totalLoadedVolume / vehicleTotalVolumeM3) * 100));

  const baselineWeightPercent = Math.round(
    (baselineCargos.reduce((s, c) => s + c.weightKg, 0) / vehicleCapacityKg) * 100
  );
  const baselineVolumePercent = Math.round(
    (baselineCargos.reduce((s, c) => s + c.volumeM3, 0) / vehicleTotalVolumeM3) * 100
  );

  return (
    <div className="bg-surface/80 border border-border rounded-2xl p-6 md:p-7 shadow-sm backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-accent mb-1">
            <Box className="w-4 h-4 text-emerald-400" />
            <span>Volumetric Space Utilization &bull; Cargo Tetris</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Vehicle Cargo Hold Fill: <span className="font-mono text-accent">{vehicleId}</span>
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Real-time volumetric 3D cross-dock allocation on 24 m³ heavy multi-axle freight bay.
          </p>
        </div>

        {/* Toggle before / after */}
        <div className="flex items-center bg-background border border-border rounded-xl p-1 shrink-0">
          <button
            onClick={() => setShowPiggyback(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !showPiggyback
                ? "bg-surface text-foreground shadow-sm font-semibold"
                : "text-muted hover:text-foreground"
            }`}
          >
            Baseline Route ({baselineVolumePercent}%)
          </button>
          <button
            onClick={() => setShowPiggyback(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showPiggyback
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-semibold"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            With PiggyBack ({volumePercent}%)
          </button>
        </div>
      </div>

      {/* Utilization Metric Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {/* Volumetric Fill Gauge */}
        <div className="bg-background/60 border border-border/70 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-accent" /> Volumetric Space Fill
            </span>
            <span className="font-mono font-bold text-foreground">
              {totalLoadedVolume.toFixed(1)} / {vehicleTotalVolumeM3} m³ ({volumePercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-surface border border-border/80 rounded-full overflow-hidden flex">
            <div
              className="bg-accent/70 h-full transition-all duration-500"
              style={{ width: `${baselineVolumePercent}%` }}
              title={`Baseline scheduled cargo: ${baselineVolumePercent}%`}
            />
            {showPiggyback && (
              <div
                className="bg-emerald-400 h-full transition-all duration-500 animate-pulse"
                style={{ width: `${volumePercent - baselineVolumePercent}%` }}
                title={`Piggybacked cargo: +${volumePercent - baselineVolumePercent}%`}
              />
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted font-mono mt-1.5">
            <span>Baseline: {baselineVolumePercent}%</span>
            {showPiggyback ? (
              <span className="text-emerald-400 font-semibold">
                +{volumePercent - baselineVolumePercent}% Piggyback Slot
              </span>
            ) : (
              <span>Empty Capacity: {100 - baselineVolumePercent}%</span>
            )}
          </div>
        </div>

        {/* Payload Weight Gauge */}
        <div className="bg-background/60 border border-border/70 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted flex items-center gap-1.5 font-medium">
              <TruckIcon className="w-3.5 h-3.5 text-blue-400" /> Payload Weight Load
            </span>
            <span className="font-mono font-bold text-foreground">
              {totalLoadedWeight.toLocaleString()} / {vehicleCapacityKg.toLocaleString()} kg ({weightPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-surface border border-border/80 rounded-full overflow-hidden flex">
            <div
              className="bg-blue-500/70 h-full transition-all duration-500"
              style={{ width: `${baselineWeightPercent}%` }}
              title={`Baseline scheduled cargo: ${baselineWeightPercent}%`}
            />
            {showPiggyback && (
              <div
                className="bg-emerald-400 h-full transition-all duration-500 animate-pulse"
                style={{ width: `${weightPercent - baselineWeightPercent}%` }}
                title={`Piggybacked cargo: +${weightPercent - baselineWeightPercent}%`}
              />
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted font-mono mt-1.5">
            <span>Baseline: {baselineWeightPercent}%</span>
            {showPiggyback ? (
              <span className="text-emerald-400 font-semibold">
                +{weightPercent - baselineWeightPercent}% Piggyback Load
              </span>
            ) : (
              <span>Remaining Payload: {vehicleCapacityKg - totalLoadedWeight} kg</span>
            )}
          </div>
        </div>
      </div>

      {/* Isometric / 3D Grid Cargo Hold Representation */}
      <div className="relative bg-background/90 border border-border rounded-xl p-4 md:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-3 text-[11px] font-mono text-muted uppercase">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Cab / Front of Trailer &rarr;</span>
          </div>
          <span>&larr; Rear Roll-Up Door / Loading Ramp</span>
        </div>

        {/* Truck Bed Graphic Frame */}
        <div className="relative border-2 border-dashed border-border/90 rounded-xl p-3 bg-gradient-to-b from-surface/20 to-surface/5 min-h-[220px]">
          {/* Isometric Depth Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-xl" />

          {/* Grid Layout: 6 columns x 4 rows */}
          <div className="grid grid-cols-6 grid-rows-4 gap-2.5 relative z-10 h-48">
            {activeCargos.map((cargo) => (
              <div
                key={cargo.id}
                onClick={() => setSelectedCargo(cargo)}
                onMouseEnter={() => setSelectedCargo(cargo)}
                style={{
                  gridColumn: `${cargo.gridSpan.col} / span ${cargo.gridSpan.width}`,
                  gridRow: `${cargo.gridSpan.row} / span ${cargo.gridSpan.height}`,
                }}
                className={`relative rounded-xl p-3 border bg-gradient-to-br ${cargo.color} cursor-pointer transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between select-none group`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="font-mono text-[10px] font-bold tracking-tight line-clamp-1">
                    {cargo.id}
                  </span>
                  {cargo.isPiggyback && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono bg-emerald-500 text-black uppercase tracking-wider shrink-0">
                      PIGGYBACK
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold leading-tight line-clamp-1">{cargo.name}</p>
                  <p className="text-[10px] opacity-80 mt-0.5 font-mono">
                    {cargo.weightKg} kg &bull; {cargo.volumeM3} m³
                  </p>
                </div>

                {/* Fragility badge */}
                <div className="flex items-center justify-between text-[9px] opacity-70 border-t border-current/20 pt-1 mt-1">
                  <span>{cargo.category}</span>
                  <span>{cargo.fragility}</span>
                </div>
              </div>
            ))}

            {/* Empty slots representation */}
            {!showPiggyback && (
              <div
                style={{
                  gridColumn: "3 / span 4",
                  gridRow: "3 / span 2",
                }}
                className="border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 rounded-xl p-3 flex flex-col items-center justify-center text-center text-emerald-400/80 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                onClick={() => setShowPiggyback(true)}
              >
                <Sparkles className="w-5 h-5 mb-1 animate-bounce text-emerald-400" />
                <span className="font-mono text-xs font-bold text-emerald-300">
                  +4.2 m³ Available Piggyback Slot
                </span>
                <span className="text-[10px] text-muted mt-0.5">Click to simulate auto-slotting SHP-2048</span>
              </div>
            )}
          </div>
        </div>

        {/* Selected Cargo Detail Footer */}
        {selectedCargo && (
          <div className="mt-4 p-3 bg-surface border border-border rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  selectedCargo.isPiggyback ? "bg-emerald-400 animate-ping" : "bg-blue-400"
                }`}
              />
              <span className="font-bold text-foreground">{selectedCargo.name}</span>
              <span className="font-mono text-muted">({selectedCargo.id})</span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span>Weight: <strong className="text-foreground">{selectedCargo.weightKg} kg</strong></span>
              <span>Volume: <strong className="text-foreground">{selectedCargo.volumeM3} m³</strong></span>
              <span>Handling: <strong className="text-foreground">{selectedCargo.fragility}</strong></span>
              {selectedCargo.isPiggyback && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Zero Empty Miles Incurred
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
