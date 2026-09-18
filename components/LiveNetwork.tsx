"use client";

import { useState } from "react";

type NetworkRoute = {
  id: string;
  origin: { name: string; x: number; y: number };
  destination: { name: string; x: number; y: number };
  capacity: string;
  distance: string;
  compatible: boolean;
};

const NODES = [
  { name: "DELHI", x: 340, y: 80 },
  { name: "KOLKATA", x: 620, y: 160 },
  { name: "MUMBAI", x: 180, y: 240 },
  { name: "PUNE", x: 260, y: 310 },
  { name: "HYDERABAD", x: 400, y: 290 },
  { name: "BENGALURU", x: 370, y: 410 },
  { name: "CHENNAI", x: 530, y: 420 },
];

const ROUTES: NetworkRoute[] = [
  { id: "RT-01", origin: { name: "HYDERABAD", x: 400, y: 290 }, destination: { name: "CHENNAI", x: 530, y: 420 }, capacity: "120 kg", distance: "+18 km", compatible: true },
  { id: "RT-02", origin: { name: "BENGALURU", x: 370, y: 410 }, destination: { name: "CHENNAI", x: 530, y: 420 }, capacity: "30 kg", distance: "+42 km", compatible: false },
  { id: "RT-03", origin: { name: "MUMBAI", x: 180, y: 240 }, destination: { name: "BENGALURU", x: 370, y: 410 }, capacity: "400 kg", distance: "+110 km", compatible: false },
  { id: "RT-04", origin: { name: "DELHI", x: 340, y: 80 }, destination: { name: "HYDERABAD", x: 400, y: 290 }, capacity: "800 kg", distance: "+30 km", compatible: false },
  { id: "RT-05", origin: { name: "MUMBAI", x: 180, y: 240 }, destination: { name: "PUNE", x: 260, y: 310 }, capacity: "200 kg", distance: "+8 km", compatible: false },
  { id: "RT-06", origin: { name: "PUNE", x: 260, y: 310 }, destination: { name: "HYDERABAD", x: 400, y: 290 }, capacity: "150 kg", distance: "+65 km", compatible: false },
  { id: "RT-07", origin: { name: "KOLKATA", x: 620, y: 160 }, destination: { name: "CHENNAI", x: 530, y: 420 }, capacity: "300 kg", distance: "+210 km", compatible: false },
  { id: "RT-08", origin: { name: "DELHI", x: 340, y: 80 }, destination: { name: "KOLKATA", x: 620, y: 160 }, capacity: "500 kg", distance: "+20 km", compatible: false },
];

export function LiveNetwork() {
  const [hoveredRoute, setHoveredRoute] = useState<NetworkRoute | null>(null);

  return (
    <section id="network" className="py-24 md:py-32 bg-surface px-5 sm:px-8 md:px-10 lg:px-14 border-y border-border overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] leading-tight font-medium tracking-tight text-foreground">
              Transportation Network
            </h2>
            <p className="text-lg text-muted mt-2">
              Piggyback continuously evaluates all moving assets.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-background px-4 py-2 border border-border rounded-full inline-flex items-center w-fit">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse mr-2" />
              <span className="font-mono text-xs font-bold tracking-widest text-muted">LIVE DIGITAL TWIN</span>
            </div>
            <a
              href="/control-tower"
              className="bg-accent/15 border border-accent/30 text-accent hover:bg-accent/25 px-4 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Open Real Map (Control Tower) &rarr;</span>
            </a>
          </div>
        </header>

        <div
          className="relative w-full bg-background rounded-3xl border border-border aspect-[4/3] md:aspect-[2/1] overflow-hidden"
          onClick={() => setHoveredRoute(null)}
        >
          <svg viewBox="0 0 800 500" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            {/* Grid */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.4" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Routes */}
            {ROUTES.map(route => (
              <g
                key={route.id}
                onMouseEnter={() => setHoveredRoute(route)}
                onMouseLeave={() => setHoveredRoute(null)}
                onClick={e => { e.stopPropagation(); setHoveredRoute(route); }}
                className="cursor-pointer"
                data-cursor="EXPLORE"
              >
                <path
                  d={`M ${route.origin.x} ${route.origin.y} L ${route.destination.x} ${route.destination.y}`}
                  stroke="transparent"
                  strokeWidth="24"
                  fill="none"
                />
                <path
                  d={`M ${route.origin.x} ${route.origin.y} L ${route.destination.x} ${route.destination.y}`}
                  stroke={hoveredRoute?.id === route.id ? "var(--accent)" : route.compatible ? "var(--accent)" : "var(--muted)"}
                  strokeWidth={hoveredRoute?.id === route.id ? "3" : route.compatible ? "2.5" : "1.2"}
                  strokeDasharray={route.compatible ? "none" : "6 6"}
                  fill="none"
                  opacity={hoveredRoute?.id === route.id ? 1 : route.compatible ? 0.7 : 0.4}
                  className="transition-all duration-200"
                />
                {hoveredRoute?.id === route.id && (
                  <circle r="4" fill="var(--accent)">
                    <animateMotion dur="2s" repeatCount="indefinite" path={`M ${route.origin.x} ${route.origin.y} L ${route.destination.x} ${route.destination.y}`} />
                  </circle>
                )}
              </g>
            ))}

            {/* Nodes */}
            {NODES.map((node, i) => (
              <g key={`node-${i}`} transform={`translate(${node.x} ${node.y})`} className="pointer-events-none">
                <circle cx="0" cy="0" r="6" fill="var(--surface)" stroke="var(--foreground)" strokeWidth="2" />
                <text y="22" textAnchor="middle" fontSize="9" fill="var(--foreground)" className="font-mono" fontWeight="bold" letterSpacing="0.1em">{node.name}</text>
              </g>
            ))}

            {/* Primary route label */}
            <g className="pointer-events-none">
              <text x="475" y="345" textAnchor="middle" fontSize="8" fill="var(--accent)" className="font-mono" fontWeight="bold" letterSpacing="0.15em" opacity="0.7">RECOVERY ROUTE</text>
            </g>
          </svg>

          {/* Hover Card */}
          {hoveredRoute && (
            <div className="absolute top-4 left-4 md:top-8 md:left-8 bg-surface/95 backdrop-blur-sm border border-border p-4 rounded-2xl shadow-lg w-56 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
                <span className="font-mono text-[10px] font-bold text-muted tracking-wider">{hoveredRoute.id}</span>
                {hoveredRoute.compatible ? (
                  <span className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-bold uppercase">Compatible</span>
                ) : (
                  <span className="text-[9px] bg-muted/10 text-muted px-1.5 py-0.5 rounded font-bold uppercase">Incompatible</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mb-3 font-medium text-xs">
                {hoveredRoute.origin.name} <span className="text-muted">→</span> {hoveredRoute.destination.name}
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted font-mono">CAPACITY</span>
                  <span className="font-medium">{hoveredRoute.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted font-mono">ADDED DIST.</span>
                  <span className="font-medium">{hoveredRoute.distance}</span>
                </div>
              </div>
            </div>
          )}

          {/* Hint */}
          {!hoveredRoute && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-surface border border-border px-4 py-2 rounded-full text-[11px] font-medium text-muted pointer-events-none">
              Hover or tap routes to explore
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
