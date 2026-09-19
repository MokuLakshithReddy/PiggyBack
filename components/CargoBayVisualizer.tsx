"use client";

import React, { useState } from "react";
import {
  Box,
  Layers,
  Truck as TruckIcon,
  Sparkles,
  CheckCircle2,
  Maximize2,
  ShieldCheck,
  ArrowRight,
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
    badgeBg: string;
    badgeText: string;
    titleColor: string;
    metaColor: string;
    dotColor: string;
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

  // Minimalist styled cargo crates with generous whitespace
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
        bg: "bg-surface hover:bg-blue-50/50",
        border: "border border-blue-300/80 hover:border-blue-500 hover:shadow-md",
        badgeBg: "bg-blue-100 text-blue-900",
        badgeText: "text-blue-900",
        titleColor: "text-foreground font-bold",
        metaColor: "text-muted font-mono",
        dotColor: "bg-blue-600",
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
        bg: "bg-surface hover:bg-amber-50/50",
        border: "border border-amber-300/80 hover:border-amber-500 hover:shadow-md",
        badgeBg: "bg-amber-100 text-amber-900",
        badgeText: "text-amber-900",
        titleColor: "text-foreground font-bold",
        metaColor: "text-muted font-mono",
        dotColor: "bg-amber-600",
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
        bg: "bg-surface hover:bg-slate-100/60",
        border: "border border-slate-300/80 hover:border-slate-500 hover:shadow-md",
        badgeBg: "bg-slate-100 text-slate-800",
        badgeText: "text-slate-800",
        titleColor: "text-foreground font-bold",
        metaColor: "text-muted font-mono",
        dotColor: "bg-slate-600",
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
      bg: "bg-emerald-50/70 hover:bg-emerald-50",
      border: "border-2 border-emerald-500/90 shadow-md ring-1 ring-emerald-500/20",
      badgeBg: "bg-emerald-600 text-white font-black",
      badgeText: "text-white",
      titleColor: "text-emerald-950 font-black",
      metaColor: "text-emerald-800 font-mono font-semibold",
      dotColor: "bg-emerald-600",
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
    <div className="bg-surface border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-accent mb-1">
            <Box className="w-3.5 h-3.5" />
            <span>Volumetric Space Utilization &bull; Cargo Tetris</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Vehicle Cargo Hold Fill: <span className="font-mono text-accent">{vehicleId}</span>
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Cross-dock volumetric layout inside a 24 m³ heavy multi-axle freight trailer.
          </p>
        </div>

        {/* Toggle before / after */}
        <div className="flex items-center bg-background border border-border/80 rounded-2xl p-1 shrink-0">
          <button
            onClick={() => setShowPiggyback(false)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !showPiggyback
                ? "bg-surface text-foreground shadow-xs border border-border/60"
                : "text-muted hover:text-foreground"
            }`}
          >
            Baseline Route ({baselineVolumePercent}%)
          </button>
          <button
            onClick={() => setShowPiggyback(true)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              showPiggyback
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            With PiggyBack ({volumePercent}%)
          </button>
        </div>
      </div>

      {/* Utilization Metric Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {/* Volumetric Fill Gauge */}
        <div className="bg-background border border-border/70 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-foreground font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-accent" /> Volumetric Space Fill
            </span>
            <span className="font-mono font-bold text-foreground">
              {totalLoadedVolume.toFixed(1)} / {vehicleTotalVolumeM3} m³{" "}
              <span className="text-accent font-black">({volumePercent}%)</span>
            </span>
          </div>

          <div className="w-full h-3 bg-surface border border-border/80 rounded-full overflow-hidden flex p-0.5">
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

          <div className="flex items-center justify-between text-[11px] font-mono mt-2">
            <span className="text-muted">Baseline: {baselineVolumePercent}%</span>
            {showPiggyback ? (
              <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                +{volumePercent - baselineVolumePercent}% Piggyback Slot Allocated
              </span>
            ) : (
              <span className="text-accent font-semibold">
                {100 - baselineVolumePercent}% Empty Air
              </span>
            )}
          </div>
        </div>

        {/* Payload Weight Gauge */}
        <div className="bg-background border border-border/70 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-foreground font-semibold flex items-center gap-1.5">
              <TruckIcon className="w-3.5 h-3.5 text-blue-600" /> Payload Weight Load
            </span>
            <span className="font-mono font-bold text-foreground">
              {totalLoadedWeight.toLocaleString()} / {vehicleCapacityKg.toLocaleString()} kg{" "}
              <span className="text-blue-600 font-black">({weightPercent}%)</span>
            </span>
          </div>

          <div className="w-full h-3 bg-surface border border-border/80 rounded-full overflow-hidden flex p-0.5">
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

          <div className="flex items-center justify-between text-[11px] font-mono mt-2">
            <span className="text-muted">Baseline: {baselineWeightPercent}%</span>
            {showPiggyback ? (
              <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                +{weightPercent - baselineWeightPercent}% Piggyback Payload
              </span>
            ) : (
              <span className="text-muted">
                Available: {vehicleCapacityKg - totalLoadedWeight} kg
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Spacious, Minimalist Isometric Cargo Hold Bed */}
      <div className="relative bg-background border border-border/80 rounded-2xl p-5 md:p-6 overflow-hidden">
        {/* Direction Labels */}
        <div className="flex items-center justify-between mb-3 text-[11px] font-mono font-bold text-muted uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-foreground">CAB / FRONT OF TRAILER &rarr;</span>
          </div>
          <span>&larr; REAR ROLL-UP DOOR / LOADING RAMP</span>
        </div>

        {/* Minimalist Trailer Floor with Generous Height & Grid Spacing */}
        <div className="relative border border-dashed border-border rounded-2xl p-4 bg-gradient-to-b from-[#F7F3EB] to-[#ECE5D8] min-h-[280px]">
          {/* Subtle Grid Floor Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none rounded-2xl" />

          {/* Grid Layout with Generous 16px Gaps and Tall 64px Rows */}
          <div className="grid grid-cols-6 grid-rows-4 gap-4 relative z-10 h-64">
            {activeCargos.map((cargo) => (
              <div
                key={cargo.id}
                onClick={() => setSelectedCargo(cargo)}
                onMouseEnter={() => setSelectedCargo(cargo)}
                style={{
                  gridColumn: `${cargo.gridSpan.col} / span ${cargo.gridSpan.width}`,
                  gridRow: `${cargo.gridSpan.row} / span ${cargo.gridSpan.height}`,
                }}
                className={`relative rounded-2xl p-4 ${cargo.theme.bg} ${cargo.theme.border} cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between select-none`}
              >
                {/* Top Row: Clean ID & Status Tag */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${cargo.theme.dotColor}`} />
                    <span className="font-mono text-xs font-bold tracking-tight text-foreground">
                      {cargo.id}
                    </span>
                  </div>

                  {cargo.isPiggyback ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-emerald-600 text-white uppercase tracking-wider shadow-xs">
                      PIGGYBACK SLOT
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-muted px-1.5 py-0.5 rounded bg-surface/80 border border-border/40">
                      {cargo.fragility}
                    </span>
                  )}
                </div>

                {/* Middle: Clean, Spacious Cargo Title */}
                <div className="my-auto py-1">
                  <p className={`text-sm md:text-base leading-snug line-clamp-1 ${cargo.theme.titleColor}`}>
                    {cargo.name}
                  </p>
                </div>

                {/* Bottom Row: Clean Metrics */}
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className={cargo.theme.metaColor}>
                    {cargo.weightKg.toLocaleString()} kg &bull; {cargo.volumeM3} m³
                  </span>
                  <span className="text-[10px] text-muted truncate max-w-[120px]">
                    {cargo.category}
                  </span>
                </div>
              </div>
            ))}

            {/* Empty slots representation when piggyback is toggled off */}
            {!showPiggyback && (
              <div
                style={{
                  gridColumn: "3 / span 4",
                  gridRow: "3 / span 2",
                }}
                className="border-2 border-dashed border-accent/60 bg-accent/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center text-accent cursor-pointer hover:bg-accent/10 transition-colors shadow-xs"
                onClick={() => setShowPiggyback(true)}
              >
                <Sparkles className="w-5 h-5 mb-1 text-accent" />
                <span className="font-mono text-xs font-bold text-accent">
                  +4.2 m³ Available Piggyback Slot
                </span>
                <span className="text-[11px] text-muted mt-0.5 font-sans">
                  Click to simulate auto-slotting SHP-2048
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Selected Cargo Detail Bar */}
        {selectedCargo ? (
          <div className="mt-4 p-3.5 bg-surface border border-border/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full ${selectedCargo.theme.dotColor}`} />
              <span className="font-bold text-foreground text-sm">{selectedCargo.name}</span>
              <span className="font-mono text-muted">({selectedCargo.id})</span>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs text-muted">
              <span>Weight: <strong className="text-foreground">{selectedCargo.weightKg} kg</strong></span>
              <span>Volume: <strong className="text-foreground">{selectedCargo.volumeM3} m³</strong></span>
              <span>Handling: <strong className="text-foreground">{selectedCargo.fragility}</strong></span>
              {selectedCargo.isPiggyback && (
                <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Piggyback Allocated
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-surface/60 border border-border/60 rounded-xl text-center text-xs font-mono text-muted">
            Hover or tap any cargo crate to inspect payload, volume, and handling directives.
          </div>
        )}
      </div>
    </div>
  );
}
