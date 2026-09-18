"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Hub, StaffShipment, Truck } from "@/lib/engine/types";
import { Layers, Maximize2, Navigation, Radio } from "lucide-react";
import { getRoadRoute } from "@/lib/engine/road-routes";

export type MapStyle = "dark" | "satellite" | "streets" | "radar";

const MAP_STYLES: Record<
  MapStyle,
  {
    name: string;
    description: string;
    url: string;
    overlayUrl?: string;
    attribution: string;
    maxZoom: number;
    className?: string;
  }
> = {
  dark: {
    name: "Midnight Cyber",
    description: "Ultra-dark high-contrast logistics canvas",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    overlayUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    maxZoom: 16,
  },
  satellite: {
    name: "Orbital Satellite",
    description: "Photorealistic true-color earth imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    overlayUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution: "Source: Esri, Maxar, Earthstar Geographics",
    maxZoom: 18,
  },
  streets: {
    name: "Transit Network",
    description: "Highways & interstate freight corridors",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, USGS",
    maxZoom: 18,
  },
  radar: {
    name: "Tactical Radar",
    description: "High-contrast tactical cyber operations grid",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 18,
    className: "radar-tile-layer",
  },
};

interface RealNetworkMapProps {
  hubs: Hub[];
  trucks: Truck[];
  shipments: StaffShipment[];
  selectedHub: Hub | null;
  onSelectHub: (hub: Hub) => void;
  onQuickSolve?: (shipmentId: string) => void;
}

export default function RealNetworkMap({
  hubs,
  trucks,
  shipments,
  selectedHub,
  onSelectHub,
  onQuickSolve,
}: RealNetworkMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const baseLayersGroupRef = useRef<any>(null);
  const markersLayerGroupRef = useRef<any>(null);
  const routesLayerGroupRef = useRef<any>(null);

  const [activeStyle, setActiveStyle] = useState<MapStyle>("dark");
  const [isLoaded, setIsLoaded] = useState(false);

  // Helper to switch map tiles
  const applyTileLayer = (styleKey: MapStyle, L: any, map: any) => {
    if (!baseLayersGroupRef.current) return;
    const baseGroup = baseLayersGroupRef.current;
    baseGroup.clearLayers();

    const cfg = MAP_STYLES[styleKey];

    const baseTile = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
      className: cfg.className || "",
    });
    baseGroup.addLayer(baseTile);

    if (cfg.overlayUrl) {
      const overlayTile = L.tileLayer(cfg.overlayUrl, {
        maxZoom: cfg.maxZoom,
      });
      baseGroup.addLayer(overlayTile);
    }
  };

  // Initialize map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Default center: Central India
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false,
      });

      // Add zoom control in top right
      L.control.zoom({ position: "topright" }).addTo(map);

      // Base tile layer group
      const baseGroup = L.layerGroup().addTo(map);
      baseLayersGroupRef.current = baseGroup;

      // Routes and markers layer groups
      routesLayerGroupRef.current = L.layerGroup().addTo(map);
      markersLayerGroupRef.current = L.layerGroup().addTo(map);

      // Apply initial style
      applyTileLayer(activeStyle, L, map);

      mapInstanceRef.current = map;
      setIsLoaded(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update tile layer when style changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    import("leaflet").then((module) => {
      const L = module.default;
      applyTileLayer(activeStyle, L, mapInstanceRef.current);
    });
  }, [activeStyle, isLoaded]);

  // Render Routes and Hubs/Trucks
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    import("leaflet").then((module) => {
      const L = module.default;
      const routesGroup = routesLayerGroupRef.current;
      const markersGroup = markersLayerGroupRef.current;

      if (!routesGroup || !markersGroup) return;

      routesGroup.clearLayers();
      markersGroup.clearLayers();

      // Quick lookup for hub coordinates
      const hubLookup: Record<string, Hub> = {};
      hubs.forEach((h) => {
        hubLookup[h.name.toLowerCase()] = h;
        hubLookup[h.id.toLowerCase()] = h;
        hubLookup[h.code.toLowerCase()] = h;
      });

      // 1. Draw turn-by-turn National Highway route polylines
      trucks.forEach((t) => {
        t.schedule.forEach((seg) => {
          const fromHub = hubLookup[seg.fromNode.toLowerCase()];
          const toHub = hubLookup[seg.toNode.toLowerCase()];

          if (fromHub && toHub) {
            const isDelayed = t.status === "Delayed";
            const color = isDelayed ? "#f59e0b" : "#38bdf8";

            // Get exact turn-by-turn road waypoints
            const roadCoords = getRoadRoute(fromHub.name, toHub.name) || [
              [fromHub.lat, fromHub.lon],
              [toHub.lat, toHub.lon],
            ];

            // Outer glowing aura line following real physical highways
            const glowLine = L.polyline(roadCoords, {
              color,
              weight: isDelayed ? 6 : 5,
              opacity: 0.35,
              lineCap: "round",
            });

            // Inner core laser stroke following real road turns
            const coreLine = L.polyline(roadCoords, {
              color,
              weight: isDelayed ? 3 : 2.5,
              opacity: 0.95,
              dashArray: isDelayed ? "6, 6" : "none",
              lineCap: "round",
              lineJoin: "round",
            });

            const tooltipHtml = `
              <div class="font-sans text-xs space-y-1">
                <div class="font-bold text-slate-100 flex items-center justify-between gap-3">
                  <span>${fromHub.name} &rarr; ${toHub.name}</span>
                  <span class="text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isDelayed ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                  }">${t.status}</span>
                </div>
                <div class="text-[10px] text-cyan-300 font-mono">
                  🛣️ ${seg.distanceKm || 350} km Turn-to-Turn Highway Corridor (${roadCoords.length} Waypoints)
                </div>
                <div class="text-[11px] text-slate-300 font-mono">Carrier: ${t.numberPlate} (${t.driverName})</div>
                <div class="text-[10px] text-slate-400">Available: ${t.availableCapacity} kg / ${t.capacity} kg</div>
              </div>
            `;

            coreLine.bindTooltip(tooltipHtml, { sticky: true, className: "custom-leaflet-tooltip" });

            routesGroup.addLayer(glowLine);
            routesGroup.addLayer(coreLine);
          }
        });
      });

      // 2. Add Hub Markers with pulsating radar rings for disruptions
      hubs.forEach((hub) => {
        const pkgsAtHub = shipments.filter(
          (s) => s.currentLocation.toLowerCase() === hub.name.toLowerCase()
        );
        const hasDisruption = pkgsAtHub.some(
          (s) => s.status === "Misplaced" || s.status === "Delayed"
        );
        const isSelected = selectedHub?.id === hub.id;

        const html = hasDisruption
          ? `
          <div class="relative group cursor-pointer" style="transform: translate(-50%, -50%);">
            <div class="absolute -inset-4 rounded-full bg-rose-500/30 animate-ping pointer-events-none"></div>
            <div class="absolute -inset-2 rounded-full bg-rose-500/50 animate-pulse pointer-events-none"></div>
            <div class="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-125 shadow-2xl bg-rose-950 border-2 border-rose-500 text-rose-300 font-mono text-[10px] font-bold">
              ${hub.code}
            </div>
            <div class="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-950/95 border border-rose-500/50 text-[10px] font-bold text-rose-300 font-mono shadow-xl pointer-events-none">
              🚨 ${hub.name.toUpperCase()} · ${pkgsAtHub.length} STRANDED
            </div>
          </div>
        `
          : `
          <div class="relative group cursor-pointer" style="transform: translate(-50%, -50%);">
            <div class="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-xl ${
              isSelected
                ? "bg-blue-950/90 border-2 border-accent text-accent scale-110"
                : hub.isOperational
                ? "bg-slate-900/90 backdrop-blur-md border-2 border-emerald-400 text-emerald-400"
                : "bg-slate-900/90 border-2 border-slate-600 text-slate-500"
            }">
              <span class="font-mono text-[9px] font-bold">${hub.code}</span>
            </div>
            <div class="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded-md bg-slate-950/90 border border-slate-800 text-[10px] font-semibold text-slate-200 font-mono shadow-md pointer-events-none">
              ${hub.name.toUpperCase()} · <span class="text-emerald-400 font-bold">${pkgsAtHub.length} pkgs</span>
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html,
          className: "custom-hub-marker",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([hub.lat, hub.lon], { icon });

        marker.on("click", () => {
          onSelectHub(hub);
        });

        // Hub Popup
        marker.bindPopup(
          `
          <div class="p-2 font-sans min-w-[210px] text-slate-100">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1 mb-2">
              <strong class="text-xs font-mono tracking-wide text-slate-200">${hub.name} Terminal (${hub.code})</strong>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${
                hub.isOperational ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              }">${hub.isOperational ? "ONLINE" : "CLOSED"}</span>
            </div>
            <p class="text-[11px] text-slate-400 mb-2">${hub.state} Logistics Corridor</p>
            <div class="space-y-1 text-[11px] text-slate-300">
              <div class="flex justify-between">
                <span class="text-slate-400">Consignments Present:</span>
                <strong class="font-mono ${hasDisruption ? "text-rose-400" : "text-emerald-400"}">${pkgsAtHub.length}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Hub Status:</span>
                <span class="text-slate-200 font-mono">${hub.isOperational ? "Active 24/7" : "Maintenance"}</span>
              </div>
            </div>
          </div>
        `,
          { className: "custom-leaflet-popup" }
        );

        markersGroup.addLayer(marker);
      });

      // 3. Add Fleet Truck Markers on physical road waypoints
      trucks.forEach((truck, i) => {
        const hub = hubLookup[truck.currentLocation.toLowerCase()] || hubs[i % hubs.length];
        if (!hub) return;

        let lat: number;
        let lon: number;

        // Position In-Transit trucks directly on the highway curve!
        if (truck.status === "In Transit" && truck.destination) {
          const road = getRoadRoute(truck.currentLocation, truck.destination);
          if (road && road.length > 20) {
            // Realistic progress along the highway
            const progress = (i % 2 === 0 ? 0.42 : 0.65);
            const idx = Math.floor(road.length * progress);
            lat = road[idx][0];
            lon = road[idx][1];
          } else {
            const destHub = hubLookup[truck.destination.toLowerCase()];
            lat = destHub ? (hub.lat + destHub.lat) / 2 : hub.lat;
            lon = destHub ? (hub.lon + destHub.lon) / 2 : hub.lon;
          }
        } else {
          // Available at hub terminal
          const angle = (i / trucks.length) * 2 * Math.PI;
          lat = hub.lat + Math.sin(angle) * 0.16;
          lon = hub.lon + Math.cos(angle) * 0.16;
        }

        const isDelayed = truck.status === "Delayed";

        const html = `
          <div class="relative cursor-pointer transition-transform hover:scale-125" style="transform: translate(-50%, -50%);">
            <div class="w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
              isDelayed
                ? "bg-amber-500 border border-amber-300 text-black ring-2 ring-amber-500/30"
                : "bg-cyan-500 border border-cyan-300 text-black ring-2 ring-cyan-500/30"
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                <path d="M15 18H9"/>
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                <circle cx="17" cy="18" r="2"/>
                <circle cx="7" cy="18" r="2"/>
              </svg>
            </div>
            ${
              isDelayed
                ? `<span class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"></span>`
                : ""
            }
          </div>
        `;

        const icon = L.divIcon({
          html,
          className: "custom-truck-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([lat, lon], { icon });

        marker.bindPopup(
          `
          <div class="p-2 font-sans min-w-[220px] text-slate-100">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1 mb-2">
              <strong class="text-xs font-mono text-cyan-400">${truck.numberPlate}</strong>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${
                isDelayed ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }">${truck.status}</span>
            </div>
            <div class="text-[11px] text-slate-300 space-y-1">
              <div>Driver: <strong>${truck.driverName}</strong> (${truck.driverMobile})</div>
              <div>Current Lane: <strong>${truck.currentLocation} &rarr; ${truck.destination}</strong></div>
              <div>Payload Capacity: <strong class="text-emerald-400 font-mono">${truck.availableCapacity} kg</strong> / ${truck.capacity} kg</div>
              <div>Available Vol: <strong>${truck.availableVolume || 15} m³</strong></div>
              ${
                truck.currentDelayMinutes
                  ? `<div class="text-amber-400 font-bold font-mono">Telemetry Delay: +${truck.currentDelayMinutes} mins</div>`
                  : ""
              }
            </div>
          </div>
        `,
          { className: "custom-leaflet-popup" }
        );

        markersGroup.addLayer(marker);
      });
    });
  }, [hubs, trucks, shipments, selectedHub, isLoaded]);

  // Center on India button
  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([20.5937, 78.9629], 5, { animate: true });
  };

  const activeTrucksCount = trucks.filter((t) => t.status === "Available" || t.status === "In Transit").length;

  return (
    <div className="relative w-full h-full min-h-[500px] flex-1 rounded-2xl overflow-hidden border border-border/80 shadow-2xl bg-[#111317]">
      {/* Real Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" style={{ minHeight: "500px" }} />

      {/* Floating Style Selector Bar (Top Left) */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="bg-background/90 backdrop-blur-md border border-border/80 rounded-xl p-1 flex items-center gap-1 shadow-2xl">
          {(Object.keys(MAP_STYLES) as MapStyle[]).map((styleKey) => (
            <button
              key={styleKey}
              onClick={() => setActiveStyle(styleKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeStyle === styleKey
                  ? "bg-accent text-white font-semibold shadow-md"
                  : "text-muted hover:text-foreground hover:bg-surface"
              }`}
              title={MAP_STYLES[styleKey].description}
            >
              {MAP_STYLES[styleKey].name}
            </button>
          ))}
        </div>

        {/* Reset View Button */}
        <button
          onClick={handleResetView}
          title="Reset to Center India"
          className="bg-background/90 backdrop-blur-md border border-border/80 hover:border-accent text-muted hover:text-foreground px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg transition-colors flex items-center gap-1.5"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Center India</span>
        </button>
      </div>

      {/* Live HUD Telemetry (Top Right) */}
      <div className="absolute top-4 right-14 z-[400] hidden md:flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs font-mono shadow-2xl pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-cyan-300 font-bold tracking-wider uppercase text-[11px]">
          MOSAIC FLEET RADAR
        </span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-300">{activeTrucksCount} FLEET ACTIVE</span>
      </div>

      {/* Floating Modern Legend Bar (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-[400] bg-background/90 backdrop-blur-md border border-border/80 rounded-xl px-3.5 py-2 text-xs font-mono shadow-xl pointer-events-auto flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
          <span className="text-muted">Hub Terminal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="text-muted">Fleet Carrier</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-muted">Delayed Carrier</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="text-rose-400 font-bold">Disrupted Cargo</span>
        </div>
      </div>
    </div>
  );
}
