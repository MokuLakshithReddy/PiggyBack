"use client";

import React, { useState } from "react";
import {
  Box,
  Layers,
  Truck as TruckIcon,
  Sparkles,
  CheckCircle2,
  Maximize2,
  Weight,
  ShieldAlert,
  ArrowRight,
  PackageCheck,
  Fuel,
} from "lucide-react";

interface CargoItem {
  id: string;
  name: string;
  category: string;
  weightKg: number;
  volumeM3: number;
  fragility: "Standard" | "Fragile" | "Perishable";
  isPiggyback: boolean;
  theme: {
    bg: string;
    border: string;
    textTitle: string;
    textSub: string;
    badgeBg: string;
    badgeText: string;
    indicator: string;
  };
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

  // Baseline cargo inside the truck, styled for warm light theme readability
  const baselineCargos: CargoItem[] = [
    {
      id: "PKG-BASE-01",
      name: "Commercial Electronics",
      category: "High-Value Tech",
      weightKg: 1850,
      volumeM3: 6.8,
      fragility: "Fragile",
      isPiggyback: false,
      theme: {
        bg: "bg-blue-50/95 hover:bg-blue-100/90",
        border: "border-blue-400/80 shadow-sm",
        textTitle: "text-blue-950 font-bold",
        textSub: "text-blue-800 font-medium",
        badgeBg: "bg-blue-200/80 text-blue-900 border-blue-300",
        badgeText: "text-blue-900",
        indicator: "bg-blue-600",
      },
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
      theme: {
        bg: "bg-amber-50/95 hover:bg-amber-100/90",
        border: "border-amber-400/80 shadow-sm",
        textTitle: "text-amber-950 font-bold",
        textSub: "text-amber-800 font-medium",
        badgeBg: "bg-amber-200/80 text-amber-900 border-amber-300",
        badgeText: "text-amber-900",
        indicator: "bg-amber-600",
      },
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
      theme: {
        bg: "bg-slate-100/95 hover:bg-slate-200/80",
        border: "border-slate-400/80 shadow-sm",
        textTitle: "text-slate-950 font-bold",
        textSub: "text-slate-700 font-medium",
        badgeBg: "bg-slate-200 text-slate-800 border-slate-300",
        badgeText: "text-slate-800",
        indicator: "bg-slate-600",
      },
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
    theme: {
      bg: "bg-emerald-50/95 hover:bg-emerald-100/90",
      border: "border-2 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md",
      textTitle: "text-emerald-950 font-black",
      textSub: "text-emerald-800 font-semibold",
      badgeBg: "bg-emerald-600 text-white font-bold shadow-sm",
      badgeText: "text-white",
      indicator: "bg-emerald-600",
    },
    gridSpan: { col: 3, row: 3, width: 4, height: 2 },
  };

  const activeCargos = showPiggyback ? [...baselineCargos, piggybackCargo] : baselineCargos;

  const totalLoadedWeight = activeCargos.reduce((sum, c) => sum + c.weightKg, 0);
  const totalLoadedVolume = activeCargos.reduce((sum, c) => sum + c.volumeM3, 0);

  const weightPercent = Math.min(100, Math.round((totalLoadedWeight / vehicleCapacityKg) * 100));
  const volumePercent = Math.min(100, Math.round((totalLoadedVolume / vehicleTotalVolumeM3) * 100));

  const baselineWeight = baselineCargos.reduce((s, c) => s + c.weightKg, 0);
  const baselineVolume = baselineCargos.reduce((s, c) => s + c.volumeM3, 0);

  const baselineWeightPercent = Math.round((baselineWeight / vehicleCapacityKg) * 100);
  const baselineVolumePercent = Math.round((baselineVolume / vehicleTotalVolumeM3) * 100);

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-accent mb-1.5">
            <Box className="w-4 h-4 text-accent" />
            <span>VOLUMETRIC SPACE UTILIZATION &bull; CARGO TETRIS</span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            Vehicle Cargo Hold Fill: <span className="font-mono text-accent font-black">{vehicleId}</span>
          </h3>
          <p className="text-xs text-muted mt-1 font-medium">
            Cross-dock volumetric cargo layout inside a 24 m³ heavy multi-axle freight trailer.
          </p>
        </div>

        {/* Toggle before / after */}
        <div className="flex items-center bg-background border border-border rounded-2xl p-1.5 shrink-0 shadow-inner">
          <button
            onClick={() => setShowPiggyback(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              !showPiggyback
                ? "bg-surface text-foreground shadow-sm border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            Baseline Route ({baselineVolumePercent}%)
          </button>
          <button
            onClick={() => setShowPiggyback(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              showPiggyback
                ? "bg-emerald-600 text-white shadow-md"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            With PiggyBack ({volumePercent}%)
          </button>
        </div>
      </div>

      {/* Utilization Metric Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
        {/* Volumetric Fill Gauge */}
        <div className="bg-background border border-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs mb-2.5">
            <span className="text-foreground flex items-center gap-1.5 font-bold">
              <Layers className="w-4 h-4 text-accent" /> Volumetric Space Fill
            </span>
            <span className="font-mono font-extrabold text-foreground text-sm">
              {totalLoadedVolume.toFixed(1)} / {vehicleTotalVolumeM3} m³{" "}
              <span className="text-accent font-black">({volumePercent}%)</span>
            </span>
          </div>

          <div className="w-full h-3.5 bg-border/40 rounded-full overflow-hidden flex p-0.5 border border-border/80">
            <div
              className="bg-accent h-full rounded-l-full transition-all duration-500"
              style={{ width: `${baselineVolumePercent}%` }}
              title={`Baseline cargo: ${baselineVolumePercent}%`}
            />
            {showPiggyback && (
              <div
                className="bg-emerald-500 h-full rounded-r-full transition-all duration-500"
                style={{ width: `${volumePercent - baselineVolumePercent}%` }}
                title={`Piggyback cargo: +${volumePercent - baselineVolumePercent}%`}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-mono font-semibold mt-2.5">
            <span className="text-muted">Baseline: {baselineVolumePercent}%</span>
            {showPiggyback ? (
              <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md text-[11px] font-bold">
                +{volumePercent - baselineVolumePercent}% Piggyback Slot Allocated
              </span>
            ) : (
              <span className="text-accent font-bold">
                {100 - baselineVolumePercent}% Empty Air Transported
              </span>
            )}
          </div>
        </div>

        {/* Payload Weight Gauge */}
        <div className="bg-background border border-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs mb-2.5">
            <span className="text-foreground flex items-center gap-1.5 font-bold">
              <TruckIcon className="w-4 h-4 text-blue-600" /> Payload Weight Load
            </span>
            <span className="font-mono font-extrabold text-foreground text-sm">
              {totalLoadedWeight.toLocaleString()} / {vehicleCapacityKg.toLocaleString()} kg{" "}
              <span className="text-blue-600 font-black">({weightPercent}%)</span>
            </span>
          </div>

          <div className="w-full h-3.5 bg-border/40 rounded-full overflow-hidden flex p-0.5 border border-border/80">
            <div
              className="bg-blue-600 h-full rounded-l-full transition-all duration-500"
              style={{ width: `${baselineWeightPercent}%` }}
              title={`Baseline cargo: ${baselineWeightPercent}%`}
            />
            {showPiggyback && (
              <div
                className="bg-emerald-500 h-full rounded-r-full transition-all duration-500"
                style={{ width: `${weightPercent - baselineWeightPercent}%` }}
                title={`Piggyback cargo: +${weightPercent - baselineWeightPercent}%`}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-mono font-semibold mt-2.5">
            <span className="text-muted">Baseline: {baselineWeightPercent}%</span>
            {showPiggyback ? (
              <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md text-[11px] font-bold">
                +{weightPercent - baselineWeightPercent}% Piggyback Payload
              </span>
            ) : (
              <span className="text-muted">
                Remaining Payload: {vehicleCapacityKg - totalLoadedWeight} kg
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Isometric Cargo Hold Container Bed */}
      <div className="relative bg-background border-2 border-border rounded-2xl p-5 md:p-6 overflow-hidden shadow-inner">
        {/* Direction Guides */}
        <div className="flex items-center justify-between mb-3 text-xs font-mono font-bold text-foreground uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-foreground">CAB / FRONT OF TRAILER &rarr;</span>
          </div>
          <span className="text-muted">&larr; REAR ROLL-UP DOOR / LOADING RAMP</span>
        </div>

        {/* Truck Bed Interior Floor */}
        <div className="relative border-2 border-dashed border-border rounded-2xl p-3.5 bg-gradient-to-b from-[#F2ECE1] to-[#EAE2D5] min-h-[240px]">
          {/* Subtle Grid Floor Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#C85B280F_1px,transparent_1px),linear-gradient(to_bottom,#C85B280F_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-2xl" />

          {/* Grid Layout: 6 columns x 4 rows */}
          <div className="grid grid-cols-6 grid-rows-4 gap-3 relative z-10 h-52">
            {activeCargos.map((cargo) => (
              <div
                key={cargo.id}
                onClick={() => setSelectedCargo(cargo)}
                onMouseEnter={() => setSelectedCargo(cargo)}
                style={{
                  gridColumn: `${cargo.gridSpan.col} / span ${cargo.gridSpan.width}`,
                  gridRow: `${cargo.gridSpan.row} / span ${cargo.gridSpan.height}`,
                }}
                className={`relative rounded-xl p-3.5 border ${cargo.theme.bg} ${cargo.theme.border} cursor-pointer transition-all duration-200 hover:scale-[1.015] hover:shadow-lg flex flex-col justify-between select-none group`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className={`font-mono text-xs font-extrabold tracking-tight ${cargo.theme.textTitle}`}>
                    {cargo.id}
                  </span>
                  {cargo.isPiggyback && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-black font-mono bg-emerald-600 text-white uppercase tracking-wider shadow-sm">
                      PIGGYBACK
                    </span>
                  )}
                </div>

                <div>
                  <p className={`text-sm leading-snug line-clamp-1 ${cargo.theme.textTitle}`}>
                    {cargo.name}
                  </p>
                  <p className={`text-xs mt-1 font-mono ${cargo.theme.textSub}`}>
                    {cargo.weightKg.toLocaleString()} kg &bull; {cargo.volumeM3} m³
                  </p>
                </div>

                {/* Fragility & Category badge */}
                <div className="flex items-center justify-between text-[10px] font-semibold border-t border-black/10 pt-1.5 mt-1 text-muted">
                  <span className="truncate max-w-[140px]">{cargo.category}</span>
                  <span className="px-1.5 py-0.2 rounded bg-white/70 border border-black/5">
                    {cargo.fragility}
                  </span>
                </div>
              </div>
            ))}

            {/* Empty slots representation when piggybacking is toggled off */}
            {!showPiggyback && (
              <div
                style={{
                  gridColumn: "3 / span 4",
                  gridRow: "3 / span 2",
                }}
                className="border-2 border-dashed border-accent/70 bg-accent/5 rounded-xl p-3.5 flex flex-col items-center justify-center text-center text-accent cursor-pointer hover:bg-accent/10 transition-colors shadow-xs"
                onClick={() => setShowPiggyback(true)}
              >
                <Sparkles className="w-5 h-5 mb-1.5 animate-bounce text-accent" />
                <span className="font-mono text-sm font-black text-accent">
                  +4.2 m³ Available Piggyback Slot
                </span>
                <span className="text-xs text-muted font-medium mt-0.5">
                  Click to simulate auto-slotting SHP-2048
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Selected Cargo Detail Footer */}
        {selectedCargo ? (
          <div className="mt-4 p-3.5 bg-surface border border-border rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className={`w-3.5 h-3.5 rounded-full ${selectedCargo.theme.indicator} shadow-xs`} />
              <span className="font-bold text-foreground text-sm">{selectedCargo.name}</span>
              <span className="font-mono text-muted font-semibold">({selectedCargo.id})</span>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs text-muted">
              <span>Weight: <strong className="text-foreground">{selectedCargo.weightKg} kg</strong></span>
              <span>Volume: <strong className="text-foreground">{selectedCargo.volumeM3} m³</strong></span>
              <span>Handling: <strong className="text-foreground">{selectedCargo.fragility}</strong></span>
              {selectedCargo.isPiggyback && (
                <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Piggyback Allocated
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-surface/60 border border-border/80 rounded-xl text-center text-xs font-mono text-muted">
            Hover or tap any cargo pallet in the trailer to inspect volume, payload weight, and handling directives.
          </div>
        )}
      </div>
    </div>
  );
}
