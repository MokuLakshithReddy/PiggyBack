"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Hub, StaffShipment, Truck } from "@/lib/engine/types";
import {
  Layers,
  Maximize2,
  Navigation,
  Radio,
  Route,
  Zap,
  ShieldCheck,
  Clock,
  ArrowRight,
  X,
  Gauge,
  Leaf,
  Package,
  Truck as TruckIcon,
  RotateCcw,
} from "lucide-react";
import { getRoadRoute } from "@/lib/engine/road-routes";

export type MapStyle = "streets" | "light" | "dark" | "satellite";

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
  streets: {
    name: "Transit Network",
    description: "Highways & interstate freight corridors",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, USGS",
    maxZoom: 18,
  },
  light: {
    name: "Clean Logistics",
    description: "Swiss minimalist high-contrast daylight grid",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    maxZoom: 19,
  },
  dark: {
    name: "Midnight Cyber",
    description: "Ultra-dark high-contrast operations canvas",
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
};

export interface ActiveCorridorInfo {
  id: string;
  highwayCode: string;
  fromHub: Hub;
  toHub: Hub;
  distanceKm: number;
  durationHours: number;
  truck?: Truck;
  segment?: any;
  coordinates: [number, number][];
}

interface RealNetworkMapProps {
  hubs: Hub[];
  trucks: Truck[];
  shipments: StaffShipment[];
  selectedHub: Hub | null;
  onSelectHub: (hub: Hub) => void;
  onQuickSolve?: (shipmentId: string) => void;
  selectedPathId?: string | null;
  onSelectPath?: (corridor: ActiveCorridorInfo | null) => void;
  highlightedCorridor?: { from: string; to: string } | null;
}

function getHighwayCode(fromCode: string, toCode: string): string {
  const pair = [fromCode.toUpperCase(), toCode.toUpperCase()].sort().join("-");
  const map: Record<string, string> = {
    "CHD-DEL": "NH-44 North Trunk (GT Road)",
    "DEL-JAI": "NH-48 Golden Quadrilateral",
    "AMD-JAI": "NH-48 Western Expressway",
    "AMD-MUM": "NH-48 Coastal Supergrid",
    "DEL-LKO": "Agra-Lucknow Exp / NH-19",
    "LKO-PAT": "NH-19 Indo-Gangetic Spine",
    "KOL-PAT": "NH-19 Eastern Gateway",
    "GAU-KOL": "NH-27 North-East Lifeline",
    "CHN-VTZ": "NH-16 Bay of Bengal Corridor",
    "BBI-VTZ": "NH-16 Coastal Logistics Trunk",
    "BBI-KOL": "NH-16 Mahanadi-Ganga Route",
    "BLR-CJB": "NH-44 / NH-544 Southern Arterial",
    "CJB-COK": "NH-544 Malabar Freightway",
    "BHO-IDR": "SH-18 / NH-46 Malwa Express",
    "BHO-NAG": "NH-46 Satpura Corridor",
    "HYD-VTZ": "NH-65 / NH-16 Deccan Bay Link",
    "AMD-IDR": "NH-47 Western Crossing",
    "BBI-NAG": "NH-53 Central-East Link",
    "BLR-CHN": "NH-48 Deccan-Coromandel Trunk",
    "HYD-PUN": "NH-65 Deccan Express",
    "BLR-HYD": "NH-44 North-South Spine",
    "CHN-HYD": "NH-16 / NH-65 Coastal Connector",
    "BLR-PUN": "NH-48 Sahyadri Freightway",
    "MUM-PUN": "Mumbai-Pune Super Expressway",
    "HYD-NAG": "NH-44 Central Cross-Dock",
    "DEL-NAG": "NH-44 Grand Trunk South",
    "DEL-MUM": "NH-48 Delhi-Mumbai Supergrid",
    "BLR-MUM": "NH-48 Western Economic Corridor",
    "KOL-NAG": "NH-53 Bengal-Vidarbha Spine",
    "CHN-NAG": "NH-44 Central-South Spine",
  };
  return map[pair] || "National Freight Corridor";
}

export default function RealNetworkMap({
  hubs,
  trucks,
  shipments,
  selectedHub,
  onSelectHub,
  onQuickSolve,
  selectedPathId,
  onSelectPath,
  highlightedCorridor,
}: RealNetworkMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const baseLayersGroupRef = useRef<any>(null);
  const markersLayerGroupRef = useRef<any>(null);
  const routesLayerGroupRef = useRef<any>(null);

  const [activeStyle, setActiveStyle] = useState<MapStyle>("streets");
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeCorridor, setActiveCorridor] = useState<ActiveCorridorInfo | null>(null);

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

      // Default center: India overview
      const map = L.map(mapContainerRef.current, {
        center: [22.2, 79.5],
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

      // Routes and markers layer groups (routes under markers)
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

  // Synchronize highlightedCorridor or selectedPathId
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    if (highlightedCorridor) {
      const fromHub = hubs.find(
        (h) =>
          h.name.toLowerCase() === highlightedCorridor.from.toLowerCase() ||
          h.code.toLowerCase() === highlightedCorridor.from.toLowerCase()
      );
      const toHub = hubs.find(
        (h) =>
          h.name.toLowerCase() === highlightedCorridor.to.toLowerCase() ||
          h.code.toLowerCase() === highlightedCorridor.to.toLowerCase()
      );

      if (fromHub && toHub) {
        const roadCoords = getRoadRoute(fromHub.name, toHub.name) || [
          [fromHub.lat, fromHub.lon],
          [toHub.lat, toHub.lon],
        ];

        const trk = trucks.find(
          (t) =>
            t.currentLocation.toLowerCase() === fromHub.name.toLowerCase() ||
            t.destination.toLowerCase() === toHub.name.toLowerCase()
        );

        const info: ActiveCorridorInfo = {
          id: `CORR-${fromHub.code}-${toHub.code}`,
          highwayCode: getHighwayCode(fromHub.code, toHub.code),
          fromHub,
          toHub,
          distanceKm: Math.round(
            Math.sqrt(Math.pow((toHub.lat - fromHub.lat) * 111, 2) + Math.pow((toHub.lon - fromHub.lon) * 105, 2)) * 1.25
          ),
          durationHours: 6,
          truck: trk,
          coordinates: roadCoords,
        };

        setActiveCorridor(info);

        // Smooth camera pan to fit highlighted corridor
        import("leaflet").then((mod) => {
          const L = mod.default;
          if (roadCoords.length > 0 && mapInstanceRef.current) {
            const bounds = L.latLngBounds(roadCoords);
            mapInstanceRef.current.fitBounds(bounds, {
              padding: [70, 70],
              maxZoom: 8,
              animate: true,
              duration: 0.8,
            });
          }
        });
      }
    } else if (!selectedPathId) {
      setActiveCorridor(null);
    }
  }, [highlightedCorridor, selectedPathId, hubs, trucks, isLoaded]);

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

      const isHighlightActive = Boolean(activeCorridor || highlightedCorridor);

      // 1. Draw turn-by-turn National Highway route polylines
      trucks.forEach((t) => {
        t.schedule.forEach((seg) => {
          const fromHub = hubLookup[seg.fromNode.toLowerCase()];
          const toHub = hubLookup[seg.toNode.toLowerCase()];

          if (fromHub && toHub) {
            const corridorId = `${t.id}-${seg.fromNode}-${seg.toNode}`;
            const isDelayed = t.status === "Delayed";

            // Check if this segment matches the selected corridor
            const isSelected =
              activeCorridor?.id === corridorId ||
              selectedPathId === corridorId ||
              selectedPathId === t.id ||
              (highlightedCorridor &&
                ((highlightedCorridor.from.toLowerCase() === fromHub.name.toLowerCase() &&
                  highlightedCorridor.to.toLowerCase() === toHub.name.toLowerCase()) ||
                  (highlightedCorridor.from.toLowerCase() === toHub.name.toLowerCase() &&
                    highlightedCorridor.to.toLowerCase() === fromHub.name.toLowerCase())));

            const roadCoords = getRoadRoute(fromHub.name, toHub.name) || [
              [fromHub.lat, fromHub.lon],
              [toHub.lat, toHub.lon],
            ];

            let glowWeight = isDelayed ? 6 : 4;
            let glowOpacity = 0.25;
            let glowColor = isDelayed ? "#f59e0b" : "#38bdf8";

            let coreWeight = 2.5;
            let coreOpacity = 0.7;
            let coreColor = isDelayed ? "#f59e0b" : "#0284c7";

            if (isHighlightActive) {
              if (isSelected) {
                // High-visibility, refined brand terracotta highlight
                glowWeight = 10;
                glowOpacity = 0.55;
                glowColor = "#C85B28";
                coreWeight = 4.5;
                coreOpacity = 1.0;
                coreColor = "#ffffff";
              } else {
                // Keep network context visible (subtly muted, not blacked out)
                glowWeight = 2;
                glowOpacity = 0.1;
                glowColor = "#94a3b8";
                coreWeight = 1.8;
                coreOpacity = 0.45;
                coreColor = "#64748b";
              }
            }

            // Glow Aura Polyline
            const glowLine = L.polyline(roadCoords, {
              color: glowColor,
              weight: glowWeight,
              opacity: glowOpacity,
              lineCap: "round",
            });

            // Inner Laser Polyline
            const coreLine = L.polyline(roadCoords, {
              color: coreColor,
              weight: coreWeight,
              opacity: coreOpacity,
              lineCap: "round",
              lineJoin: "round",
            });

            const hwCode = getHighwayCode(fromHub.code, toHub.code);
            const tooltipHtml = `
              <div class="font-sans text-xs space-y-1 min-w-[210px]">
                <div class="font-bold text-slate-100 flex items-center justify-between gap-3">
                  <span>${fromHub.name} &rarr; ${toHub.name}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected
                      ? "bg-orange-500/30 text-orange-300 border border-orange-500/50"
                      : isDelayed
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }">${isSelected ? "ACTIVE CORRIDOR" : t.status}</span>
                </div>
                <div class="text-[10px] text-cyan-300 font-mono font-semibold">
                  🛣️ ${hwCode} · ${seg.distanceKm || 350} km
                </div>
                <div class="text-[11px] text-slate-300 font-mono">Carrier: <strong>${t.numberPlate}</strong> (${t.driverName})</div>
                <div class="text-[10px] text-slate-400">Available: ${t.availableCapacity} kg / ${t.capacity} kg</div>
              </div>
            `;

            coreLine.bindTooltip(tooltipHtml, { sticky: true, className: "custom-leaflet-tooltip" });

            // Click Handler
            const handleCorridorClick = (e: any) => {
              if (L.DomEvent) L.DomEvent.stopPropagation(e);

              const info: ActiveCorridorInfo = {
                id: corridorId,
                highwayCode: hwCode,
                fromHub,
                toHub,
                distanceKm: seg.distanceKm || 350,
                durationHours: Math.round(((new Date(seg.arrivalTime).getTime() - new Date(seg.departureTime).getTime()) / 3600000) * 10) / 10 || 6,
                truck: t,
                segment: seg,
                coordinates: roadCoords,
              };

              const willSelect = activeCorridor?.id !== corridorId;
              setActiveCorridor(willSelect ? info : null);
              onSelectPath?.(willSelect ? info : null);

              if (willSelect && roadCoords.length > 0 && mapInstanceRef.current) {
                const bounds = L.latLngBounds(roadCoords);
                mapInstanceRef.current.fitBounds(bounds, {
                  padding: [70, 70],
                  maxZoom: 8,
                  animate: true,
                  duration: 0.8,
                });
              }
            };

            coreLine.on("click", handleCorridorClick);
            glowLine.on("click", handleCorridorClick);

            routesGroup.addLayer(glowLine);
            routesGroup.addLayer(coreLine);

            if (isSelected) {
              glowLine.bringToFront();
              coreLine.bringToFront();
            }
          }
        });
      });

      // If highlightedCorridor is set but not covered by scheduled truck legs (e.g. ad-hoc recovery corridor)
      if (
        highlightedCorridor &&
        hubLookup[highlightedCorridor.from.toLowerCase()] &&
        hubLookup[highlightedCorridor.to.toLowerCase()]
      ) {
        const h1 = hubLookup[highlightedCorridor.from.toLowerCase()];
        const h2 = hubLookup[highlightedCorridor.to.toLowerCase()];
        const directRoad = getRoadRoute(h1.name, h2.name) || [
          [h1.lat, h1.lon],
          [h2.lat, h2.lon],
        ];

        // Draw dedicated recovery corridor
        const recoveryGlow = L.polyline(directRoad, {
          color: "#C85B28",
          weight: 12,
          opacity: 0.6,
          lineCap: "round",
        });

        const recoveryCore = L.polyline(directRoad, {
          color: "#ffffff",
          weight: 4.5,
          opacity: 1.0,
          dashArray: "6, 8",
          lineCap: "round",
        });

        recoveryCore.bindTooltip(
          `<div class="font-mono text-xs font-bold text-orange-400">🚨 PIGGYBACK RECOVERY CORRIDOR: ${h1.name} ➔ ${h2.name}</div>`,
          { sticky: true, className: "custom-leaflet-tooltip" }
        );

        routesGroup.addLayer(recoveryGlow);
        routesGroup.addLayer(recoveryCore);
        recoveryGlow.bringToFront();
        recoveryCore.bringToFront();
      }

      // 2. Add All 20 Hub Markers with High-Contrast Pins and Permanent Labels
      hubs.forEach((hub) => {
        const pkgsAtHub = shipments.filter(
          (s) => s.currentLocation.toLowerCase() === hub.name.toLowerCase()
        );
        const hasDisruption = pkgsAtHub.some(
          (s) => s.status === "Misplaced" || s.status === "Delayed"
        );
        const isSelected = selectedHub?.id === hub.id;

        const badgeClass = hasDisruption
          ? "hub-badge hub-badge-disrupted"
          : isSelected
          ? "hub-badge hub-badge-selected"
          : "hub-badge hub-badge-normal";

        const labelClass = hasDisruption
          ? "hub-label hub-label-disrupted"
          : "hub-label";

        const labelText = hasDisruption
          ? `🚨 ${hub.name} (${pkgsAtHub.length})`
          : hub.name;

        const html = `
          <div class="hub-pin">
            <div class="${badgeClass}">
              <span>${hub.code}</span>
            </div>
            <div class="${labelClass}">
              ${labelText}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html,
          className: "custom-hub-marker",
          iconSize: [80, 56],
          iconAnchor: [40, 16],
        });

        const marker = L.marker([hub.lat, hub.lon], { icon, zIndexOffset: hasDisruption ? 1000 : 500 });

        marker.on("click", () => {
          onSelectHub(hub);
        });

        // Hub Popup
        marker.bindPopup(
          `
          <div class="p-2 font-sans min-w-[220px] text-slate-100">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1 mb-2">
              <strong class="text-xs font-mono tracking-wide text-slate-200">${hub.name} Hub (${hub.code})</strong>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${
                hub.isOperational ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              }">${hub.isOperational ? "ONLINE" : "CLOSED"}</span>
            </div>
            <p class="text-[11px] text-slate-400 mb-2">${hub.state} Logistics Hub</p>
            <div class="space-y-1 text-[11px] text-slate-300">
              <div class="flex justify-between">
                <span class="text-slate-400">Consignments Here:</span>
                <strong class="font-mono ${hasDisruption ? "text-rose-400 font-bold" : "text-emerald-400"}">${pkgsAtHub.length}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Terminal Gate:</span>
                <span class="text-slate-200 font-mono">${hub.isOperational ? "Active 24/7" : "Maintenance"}</span>
              </div>
            </div>
          </div>
        `,
          { className: "custom-leaflet-popup" }
        );

        markersGroup.addLayer(marker);
      });

      // 3. Add Fleet Truck Markers
      trucks.forEach((truck, i) => {
        const hub = hubLookup[truck.currentLocation.toLowerCase()] || hubs[i % hubs.length];
        if (!hub) return;

        let lat: number;
        let lon: number;

        if (truck.status === "In Transit" && truck.destination) {
          const road = getRoadRoute(truck.currentLocation, truck.destination);
          if (road && road.length > 20) {
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
          // Subtle offset around hub perimeter
          const angle = (i / trucks.length) * 2 * Math.PI;
          lat = hub.lat + Math.sin(angle) * 0.18;
          lon = hub.lon + Math.cos(angle) * 0.18;
        }

        const isDelayed = truck.status === "Delayed";

        const html = `
          <div class="cursor-pointer transition-transform hover:scale-125" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
            <div class="w-6 h-6 rounded-full flex items-center justify-center ${
              isDelayed
                ? "bg-amber-500 border border-amber-200 text-black ring-2 ring-amber-500/30"
                : "bg-cyan-500 border border-cyan-200 text-black ring-2 ring-cyan-500/30"
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                <path d="M15 18H9"/>
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                <circle cx="17" cy="18" r="2"/>
                <circle cx="7" cy="18" r="2"/>
              </svg>
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html,
          className: "custom-truck-marker",
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker([lat, lon], { icon, zIndexOffset: 200 });

        marker.bindPopup(
          `
          <div class="p-2 font-sans min-w-[210px] text-slate-100">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1 mb-2">
              <strong class="text-xs font-mono text-cyan-400">${truck.numberPlate}</strong>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${
                isDelayed ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }">${truck.status}</span>
            </div>
            <div class="text-[11px] text-slate-300 space-y-1">
              <div>Pilot: <strong>${truck.driverName}</strong> (${truck.driverMobile})</div>
              <div>Route: <strong>${truck.currentLocation} &rarr; ${truck.destination}</strong></div>
              <div>Payload Capacity: <strong class="text-emerald-400 font-mono">${truck.availableCapacity} kg</strong> / ${truck.capacity} kg</div>
            </div>
          </div>
        `,
          { className: "custom-leaflet-popup" }
        );

        markersGroup.addLayer(marker);
      });
    });
  }, [hubs, trucks, shipments, selectedHub, isLoaded, activeCorridor, selectedPathId, highlightedCorridor]);

  // Center on India button
  const handleResetView = () => {
    setActiveCorridor(null);
    onSelectPath?.(null);
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([22.2, 79.5], 5, { animate: true });
  };

  const activeTrucksCount = trucks.filter((t) => t.status === "Available" || t.status === "In Transit").length;

  return (
    <div className="relative w-full h-full min-h-[520px] flex-1 rounded-2xl overflow-hidden border border-border/80 shadow-2xl bg-[#111317]">
      {/* Real Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" style={{ minHeight: "520px" }} />

      {/* Floating Style Selector Bar (Top Left) */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="bg-background/95 backdrop-blur-md border border-border rounded-xl p-1 flex items-center gap-1 shadow-xl">
          {(Object.keys(MAP_STYLES) as MapStyle[]).map((styleKey) => (
            <button
              key={styleKey}
              onClick={() => setActiveStyle(styleKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                activeStyle === styleKey
                  ? "bg-accent text-white font-semibold shadow-xs"
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
          title="Reset to Full Pan-India Grid"
          className="bg-background/95 backdrop-blur-md border border-border hover:border-accent text-muted hover:text-foreground px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Center India (20 Hubs)</span>
        </button>
      </div>

      {/* Live HUD Telemetry (Top Right) */}
      <div className="absolute top-4 right-14 z-[400] hidden md:flex items-center gap-2 bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-xl px-3.5 py-1.5 text-xs font-mono shadow-xl pointer-events-none">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-cyan-300 font-bold tracking-wider uppercase text-[11px]">
          MOSAIC FLEET RADAR
        </span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-200 font-bold">{hubs.length} HUBS</span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-300">{activeTrucksCount} TRUCKS</span>
      </div>

      {/* JURY FLOATING TELEMETRY INSPECTION BADGE (When a route/corridor is selected) */}
      {activeCorridor && (
        <div className="absolute bottom-16 left-4 right-4 sm:left-auto sm:right-4 sm:w-[440px] z-[450] pointer-events-auto bg-slate-950/95 border border-orange-500/70 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-orange-400 tracking-wider uppercase">
                ACTIVE CORRIDOR INSPECTOR
              </span>
            </div>
            <button
              onClick={() => {
                setActiveCorridor(null);
                onSelectPath?.(null);
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Corridor Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 font-sans">
            <div>
              <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-0.5">
                {activeCorridor.highwayCode}
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span>{activeCorridor.fromHub.name} ({activeCorridor.fromHub.code})</span>
                <ArrowRight className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>{activeCorridor.toHub.name} ({activeCorridor.toHub.code})</span>
              </div>
            </div>

            {/* 3-Metric Strip */}
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-center font-mono">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">DISTANCE</span>
                <span className="text-xs font-bold text-slate-100">{activeCorridor.distanceKm} km</span>
              </div>
              <div className="border-x border-slate-800 px-1">
                <span className="text-[9px] text-slate-400 block uppercase">PAYLOAD CAP</span>
                <span className="text-xs font-bold text-emerald-400">
                  {activeCorridor.truck ? `${activeCorridor.truck.availableCapacity} kg` : "Dynamic"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">CARBON SAVED</span>
                <span className="text-xs font-bold text-emerald-400">
                  -{Math.round(activeCorridor.distanceKm * 0.28)}kg CO₂
                </span>
              </div>
            </div>

            {activeCorridor.truck && (
              <div className="flex items-center justify-between text-xs text-slate-300 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <TruckIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Carrier: <strong className="font-mono text-cyan-300">{activeCorridor.truck.numberPlate}</strong></span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Pilot: {activeCorridor.truck.driverName}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={handleResetView}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset Focus
              </button>

              <span className="text-[10px] text-orange-400 font-mono font-semibold">
                ✓ Route Isolated
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Modern Legend Bar (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-[400] bg-background/95 backdrop-blur-md border border-border/80 rounded-xl px-3.5 py-2 text-xs font-mono shadow-xl pointer-events-auto flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
          <span className="text-foreground font-semibold">Hub Terminal (20)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="text-muted">Fleet Carrier</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-orange-500/30" />
          <span className="text-orange-500 font-bold">Selected Path</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="text-rose-500 font-bold">Disrupted Cargo</span>
        </div>
      </div>
    </div>
  );
}
