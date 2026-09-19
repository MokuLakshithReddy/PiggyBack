"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { StaffShipment } from "@/lib/engine/types";
import { getRoadRoute } from "@/lib/engine/road-routes";
import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
  MapPin,
  Truck as TruckIcon,
  Leaf,
  Navigation,
  Layers,
  Crosshair,
  Clock,
  ShieldCheck,
  Zap,
} from "lucide-react";

// Hub coordinates lookup covering the 20 Pan-India Hubs + strategic interchange junctions
const EXTENDED_CITY_COORDS: Record<string, [number, number]> = {
  HYDERABAD: [17.385, 78.4867],
  BENGALURU: [12.9716, 77.5946],
  CHENNAI: [13.0827, 80.2707],
  MUMBAI: [19.076, 72.8777],
  PUNE: [18.5204, 73.8567],
  DELHI: [28.6139, 77.209],
  KOLKATA: [22.5726, 88.3639],
  NAGPUR: [21.1458, 79.0882],
  AHMEDABAD: [23.0225, 72.5714],
  JAIPUR: [26.9124, 75.7873],
  LUCKNOW: [26.8467, 80.9462],
  PATNA: [25.5941, 85.1376],
  GUWAHATI: [26.1445, 91.7362],
  BHUBANESWAR: [20.2961, 85.8245],
  KOCHI: [9.9312, 76.2673],
  VISAKHAPATNAM: [17.6868, 83.2185],
  INDORE: [22.7196, 75.8577],
  CHANDIGARH: [30.7333, 76.7794],
  BHOPAL: [23.2599, 77.4126],
  COIMBATORE: [11.0168, 76.9558],
  // Additional highway junctions
  KURNOOL: [15.8281, 78.0373],
  SURAT: [21.1702, 72.8311],
  VIJAYAWADA: [16.5062, 80.648],
  KANPUR: [26.4499, 80.3319],
  VARANASI: [25.3176, 82.9739],
  RAIPUR: [21.2514, 81.6296],
};

function resolveCoord(name: string): [number, number] | null {
  const key = name.toUpperCase().trim();
  if (EXTENDED_CITY_COORDS[key]) return EXTENDED_CITY_COORDS[key];
  for (const [k, v] of Object.entries(EXTENDED_CITY_COORDS)) {
    if (k.startsWith(key) || key.startsWith(k)) return v;
  }
  return null;
}

function calculateBearing(startLat: number, startLon: number, endLat: number, endLon: number): number {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLonRad = (startLon * Math.PI) / 180;
  const endLatRad = (endLat * Math.PI) / 180;
  const endLonRad = (endLon * Math.PI) / 180;
  const dLon = endLonRad - startLonRad;
  const y = Math.sin(dLon) * Math.cos(endLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(endLatRad) -
    Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(dLon);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface LiveShipmentTrackingMapProps {
  shipment: StaffShipment;
  routeStops?: string[];
  assignedTruckId?: string;
  driverName?: string;
  driverMobile?: string;
}

export function LiveShipmentTrackingMap({
  shipment,
  routeStops,
  assignedTruckId,
  driverName = "Rajesh Verma",
  driverMobile = "+91 98451 23098",
}: LiveShipmentTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const truckMarkerRef = useRef<any>(null);
  const traversedPolylineRef = useRef<any>(null);
  const remainingPolylineRef = useRef<any>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [activeStyle, setActiveStyle] = useState<"light" | "streets" | "dark">("light");
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.5);
  const [progress, setProgress] = useState(0.28); // Initial starting point (28% en route)
  const [autoCenter, setAutoCenter] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Compute canonical route stops
  const stops = useMemo(() => {
    if (routeStops && routeStops.length >= 2) return routeStops;
    if (shipment.plannedRoute && shipment.plannedRoute.length >= 2) return shipment.plannedRoute;
    if (shipment.currentLocation && shipment.currentLocation !== shipment.origin && shipment.currentLocation !== shipment.destination) {
      return [shipment.origin, shipment.currentLocation, shipment.destination];
    }
    return [shipment.origin, shipment.destination];
  }, [routeStops, shipment]);

  // Compute turn-by-turn road coordinates across stops
  const { coordinates, cumulativeDistances, totalDistanceKm } = useMemo(() => {
    const coords: [number, number][] = [];
    for (let i = 0; i < stops.length - 1; i++) {
      const from = stops[i];
      const to = stops[i + 1];
      const leg = getRoadRoute(from, to);
      if (leg && leg.length > 0) {
        if (coords.length > 0) {
          coords.push(...leg.slice(1));
        } else {
          coords.push(...leg);
        }
      } else {
        const c1 = resolveCoord(from);
        const c2 = resolveCoord(to);
        if (c1 && c2) {
          if (coords.length > 0) coords.push(c2);
          else coords.push(c1, c2);
        }
      }
    }

    // Safety fallback if no coordinates found
    if (coords.length < 2) {
      const c1 = resolveCoord(stops[0]) || [17.385, 78.4867];
      const c2 = resolveCoord(stops[stops.length - 1]) || [13.0827, 80.2707];
      coords.push(c1, c2);
    }

    // Calculate cumulative distances
    const cumDist: number[] = [0];
    let total = 0;
    for (let i = 1; i < coords.length; i++) {
      const d = getDistanceKm(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
      total += d;
      cumDist.push(total);
    }

    return {
      coordinates: coords,
      cumulativeDistances: cumDist,
      totalDistanceKm: Math.max(1, Math.round(total)),
    };
  }, [stops]);

  // Interpolate state at current progress
  const currentState = useMemo(() => {
    if (coordinates.length < 2) {
      return {
        lat: 17.385,
        lon: 78.4867,
        bearing: 145,
        distCoveredKm: 0,
        speedKmH: 64,
      };
    }

    const targetDist = progress * (cumulativeDistances[cumulativeDistances.length - 1] || 1);
    
    // Find segment
    let segIdx = 0;
    while (
      segIdx < cumulativeDistances.length - 1 &&
      cumulativeDistances[segIdx + 1] < targetDist
    ) {
      segIdx++;
    }

    const p1 = coordinates[segIdx];
    const p2 = coordinates[Math.min(segIdx + 1, coordinates.length - 1)];
    const segDist = cumulativeDistances[segIdx + 1] - cumulativeDistances[segIdx] || 0.0001;
    const subProgress = Math.max(0, Math.min(1, (targetDist - cumulativeDistances[segIdx]) / segDist));

    const lat = p1[0] + (p2[0] - p1[0]) * subProgress;
    const lon = p1[1] + (p2[1] - p1[1]) * subProgress;
    const bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);

    // Simulated realistic truck speed fluctuations
    const speedNoise = Math.sin(progress * 40) * 3;
    const speedKmH = Math.round(62 + speedNoise);

    return {
      lat,
      lon,
      bearing: Math.round(bearing),
      distCoveredKm: Math.round(targetDist),
      speedKmH,
    };
  }, [progress, coordinates, cumulativeDistances]);

  // Truck plate / ID display
  const truckId = assignedTruckId || shipment.assignedTruck || "TRK-003";

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [currentState.lat, currentState.lon],
        zoom: 7,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false,
      });

      L.control.zoom({ position: "topright" }).addTo(map);

      // Tile layers
      const tileLayers: Record<string, any> = {
        light: L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: "&copy; OpenStreetMap &copy; CARTO",
          maxZoom: 19,
        }),
        streets: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
          attribution: "Tiles &copy; Esri",
          maxZoom: 18,
        }),
        dark: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
          attribution: "Tiles &copy; Esri",
          maxZoom: 16,
        }),
      };

      tileLayers[activeStyle].addTo(map);
      (map as any)._customTileLayers = tileLayers;

      mapInstanceRef.current = map;
      setIsMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Style
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const tileLayers = (map as any)._customTileLayers;
    if (!tileLayers) return;

    Object.values(tileLayers).forEach((layer: any) => map.removeLayer(layer));
    if (tileLayers[activeStyle]) {
      tileLayers[activeStyle].addTo(map);
    }
  }, [activeStyle]);

  // Draw Polylines & Waypoint Markers on route change
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || coordinates.length < 2) return;
    const map = mapInstanceRef.current;
    const L = (window as any).L || (require("leaflet") as any);

    // Remove existing layers if any
    if ((map as any)._trackingLayers) {
      (map as any)._trackingLayers.forEach((layer: any) => map.removeLayer(layer));
    }
    const trackingLayers: any[] = [];

    // Outer soft glow corridor
    const outerGlow = L.polyline(coordinates, {
      color: "#C85B28",
      weight: 10,
      opacity: 0.18,
      lineCap: "round",
    }).addTo(map);
    trackingLayers.push(outerGlow);

    // Full Route Outline
    const fullRouteLine = L.polyline(coordinates, {
      color: "#1E242D",
      weight: 4,
      opacity: 0.35,
      dashArray: "6, 6",
    }).addTo(map);
    trackingLayers.push(fullRouteLine);

    // Dynamic Traversed Path (Solid Vivid Emerald / Terracotta)
    const traversedLine = L.polyline([], {
      color: "#10B981",
      weight: 4.5,
      opacity: 0.95,
      lineCap: "round",
    }).addTo(map);
    traversedPolylineRef.current = traversedLine;
    trackingLayers.push(traversedLine);

    // Dynamic Remaining Path (Dashed)
    const remainingLine = L.polyline([], {
      color: "#C85B28",
      weight: 3.5,
      opacity: 0.85,
      dashArray: "5, 7",
    }).addTo(map);
    remainingPolylineRef.current = remainingLine;
    trackingLayers.push(remainingLine);

    // Add Waypoint Markers (Origin, Intermediates, Destination)
    stops.forEach((stopName, idx) => {
      const coord = resolveCoord(stopName);
      if (!coord) return;

      const isOrigin = idx === 0;
      const isDestination = idx === stops.length - 1;
      const isInterchange = !isOrigin && !isDestination;

      const badgeClass = isOrigin
        ? "waypoint-badge-origin"
        : isInterchange
        ? "waypoint-badge-interchange"
        : "waypoint-badge-dest";

      const badgeEmoji = isOrigin ? "🚩" : isInterchange ? "⚡" : "🏁";
      const tagText = isOrigin
        ? `ORIGIN: ${stopName}`
        : isInterchange
        ? `INTERCHANGE: ${stopName}`
        : `DESTINATION: ${stopName}`;

      const icon = L.divIcon({
        className: "tracking-waypoint-pin",
        html: `
          <div class="waypoint-badge ${badgeClass}">
            <span>${badgeEmoji}</span>
          </div>
          <div class="waypoint-tag">${tagText}</div>
        `,
        iconSize: [120, 56],
        iconAnchor: [60, 24],
      });

      const marker = L.marker(coord, { icon, zIndexOffset: 400 }).addTo(map);
      trackingLayers.push(marker);
    });

    // Create Truck Marker
    const truckIcon = L.divIcon({
      className: "custom-truck-icon",
      html: `
        <div class="truck-marker-wrap" id="live-truck-marker">
          <div class="truck-pulse-ring"></div>
          <div class="truck-chassis" id="truck-chassis-elem" style="transform: rotate(${currentState.bearing}deg);">
            <div class="truck-headlights"></div>
            <svg width="34" height="46" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="5" width="28" height="38" rx="6" fill="rgba(0,0,0,0.4)" filter="blur(3px)" />
              <rect x="4" y="14" width="26" height="28" rx="4" fill="#1E242D" stroke="#4B5563" stroke-width="1.5" />
              <rect x="6" y="16" width="22" height="12" rx="2" fill="#2A323D" />
              <path d="M4 27h26v4H4z" fill="#C85B28" />
              <text x="17" y="25" text-anchor="middle" font-size="6.5" font-weight="900" font-family="monospace" fill="#FFFFFF">MOSAIC</text>
              <rect x="2" y="18" width="3" height="7" rx="1.5" fill="#111827" />
              <rect x="29" y="18" width="3" height="7" rx="1.5" fill="#111827" />
              <rect x="2" y="32" width="3" height="7" rx="1.5" fill="#111827" />
              <rect x="29" y="32" width="3" height="7" rx="1.5" fill="#111827" />
              <path d="M7 6C7 3.79086 8.79086 2 11 2H23C25.2091 2 27 3.79086 27 6V14H7V6Z" fill="#C85B28" stroke="#F6F1E8" stroke-width="1.2" />
              <path d="M9 7C9 5.89543 9.89543 5 11 5H23C24.1046 5 25 5.89543 25 7V10H9V7Z" fill="#7DD3FC" opacity="0.95" />
              <circle cx="10" cy="3" r="1.5" fill="#FEF08A" />
              <circle cx="24" cy="3" r="1.5" fill="#FEF08A" />
            </svg>
          </div>
          <div class="truck-live-tag">
            <span class="dot"></span>
            <span id="truck-tag-text">${truckId} · ${currentState.speedKmH} km/h</span>
          </div>
        </div>
      `,
      iconSize: [90, 90],
      iconAnchor: [45, 45],
    });

    const truckMarker = L.marker([currentState.lat, currentState.lon], {
      icon: truckIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    truckMarkerRef.current = truckMarker;
    trackingLayers.push(truckMarker);

    (map as any)._trackingLayers = trackingLayers;

    // Fit map bounds to whole route with comfortable padding
    const bounds = L.latLngBounds(coordinates);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
  }, [isMapReady, coordinates, stops]);

  // Smooth Animation Loop
  useEffect(() => {
    if (!isPlaying) return;

    let lastTimestamp = performance.now();

    const frame = (now: number) => {
      const dt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      // Advance progress: complete a full trip in ~35 seconds at 1x speed
      const delta = (dt / 35) * speedMultiplier;
      setProgress((prev) => {
        const next = prev + delta;
        if (next >= 1.0) {
          // Seamless loop back to start after a brief pause
          return 0;
        }
        return next;
      });

      animFrameIdRef.current = requestAnimationFrame(frame);
    };

    animFrameIdRef.current = requestAnimationFrame(frame);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying, speedMultiplier]);

  // Update Truck marker position & polyline trail whenever progress updates
  useEffect(() => {
    if (!truckMarkerRef.current || coordinates.length < 2) return;

    const truckMarker = truckMarkerRef.current;
    truckMarker.setLatLng([currentState.lat, currentState.lon]);

    // Update rotation and tag text directly in DOM for maximum 60fps smoothness
    const chassisElem = document.getElementById("truck-chassis-elem");
    if (chassisElem) {
      chassisElem.style.transform = `rotate(${currentState.bearing}deg)`;
    }
    const tagElem = document.getElementById("truck-tag-text");
    if (tagElem) {
      tagElem.innerText = `${truckId} · ${currentState.speedKmH} km/h`;
    }

    // Split coordinates into traversed and remaining
    const targetDist = progress * (cumulativeDistances[cumulativeDistances.length - 1] || 1);
    let splitIdx = 0;
    while (
      splitIdx < cumulativeDistances.length - 1 &&
      cumulativeDistances[splitIdx + 1] < targetDist
    ) {
      splitIdx++;
    }

    const traversed = [
      ...coordinates.slice(0, splitIdx + 1),
      [currentState.lat, currentState.lon] as [number, number],
    ];
    const remaining = [
      [currentState.lat, currentState.lon] as [number, number],
      ...coordinates.slice(splitIdx + 1),
    ];

    if (traversedPolylineRef.current) {
      traversedPolylineRef.current.setLatLngs(traversed);
    }
    if (remainingPolylineRef.current) {
      remainingPolylineRef.current.setLatLngs(remaining);
    }

    // Auto-center map if enabled
    if (autoCenter && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([currentState.lat, currentState.lon], {
        animate: true,
        duration: 0.2,
      });
    }
  }, [currentState, progress, autoCenter, coordinates, cumulativeDistances, truckId]);

  // Recenter map on route bounds
  const handleFitRoute = () => {
    if (!mapInstanceRef.current || coordinates.length < 2) return;
    const L = (window as any).L || (require("leaflet") as any);
    const bounds = L.latLngBounds(coordinates);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    setAutoCenter(false);
  };

  // Center on current truck
  const handleCenterOnTruck = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([currentState.lat, currentState.lon], 9, {
      duration: 0.8,
    });
    setAutoCenter(true);
  };

  const etaMinutesRemaining = Math.max(
    10,
    Math.round(((1 - progress) * totalDistanceKm) / (currentState.speedKmH / 60))
  );
  const etaHours = Math.floor(etaMinutesRemaining / 60);
  const etaMins = etaMinutesRemaining % 60;

  return (
    <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl transition-all mb-8">
      {/* HUD Header */}
      <div className="p-4 sm:p-6 border-b border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
            <TruckIcon className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold font-mono text-foreground flex items-center gap-1.5">
                <span>{shipment.id}</span>
                <span className="text-muted text-xs font-normal">({shipment.code})</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE FREIGHT TRACKING
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-foreground">{stops[0]}</span>
              <span>➔</span>
              {stops.length > 2 && (
                <>
                  <span className="text-amber-400 font-mono text-[11px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    via {stops.slice(1, -1).join(" · ")}
                  </span>
                  <span>➔</span>
                </>
              )}
              <span className="font-semibold text-accent">{stops[stops.length - 1]}</span>
              <span className="text-muted/60">·</span>
              <span className="font-mono text-[11px]">{totalDistanceKm} km Corridor</span>
            </p>
          </div>
        </div>

        {/* Map View & Telemetry Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Map style buttons */}
          <div className="flex items-center bg-background/80 p-1 rounded-xl border border-border text-xs font-mono">
            <button
              onClick={() => setActiveStyle("light")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                activeStyle === "light"
                  ? "bg-foreground text-background font-bold shadow"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setActiveStyle("streets")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                activeStyle === "streets"
                  ? "bg-foreground text-background font-bold shadow"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Transit
            </button>
            <button
              onClick={() => setActiveStyle("dark")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                activeStyle === "dark"
                  ? "bg-foreground text-background font-bold shadow"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Cyber
            </button>
          </div>

          {/* Recenter / Focus Controls */}
          <button
            onClick={handleCenterOnTruck}
            className={`p-2 rounded-xl border transition-colors flex items-center gap-1 text-xs font-mono ${
              autoCenter
                ? "bg-accent text-white border-accent"
                : "bg-surface border-border text-muted hover:text-foreground hover:border-accent"
            }`}
            title="Lock View on Moving Truck"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Follow Truck</span>
          </button>

          <button
            onClick={handleFitRoute}
            className="p-2 rounded-xl bg-surface border border-border text-muted hover:text-foreground hover:border-accent text-xs transition-colors"
            title="Reset Map to Full Route"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Map Container */}
      <div className="relative w-full h-[380px] sm:h-[460px] bg-background">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Top Telemetry Pill Overlay */}
        <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-none">
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-xl text-slate-100 flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-slate-700/80 pr-4">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">FLEET CARRIER</p>
                <p className="text-xs font-bold font-mono text-emerald-400">{truckId}</p>
              </div>
            </div>
            <div className="border-r border-slate-700/80 pr-4">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">SPEED</p>
              <p className="text-xs font-bold font-mono text-slate-100 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-accent" />
                {currentState.speedKmH} km/h
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">ESTIMATED ARRIVAL</p>
              <p className="text-xs font-bold font-mono text-slate-100 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                {etaHours > 0 ? `${etaHours}h ${etaMins}m` : `${etaMins}m`}
              </p>
            </div>
          </div>
        </div>

        {/* Floating Bottom Left Corridor Indicator */}
        <div className="absolute bottom-4 left-4 z-[400] pointer-events-none hidden sm:block">
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-xl text-slate-100 max-w-xs text-xs space-y-1">
            <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
              <span>TRIP PROGRESS</span>
              <strong className="text-accent">{Math.round(progress * 100)}% COMPLETED</strong>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-accent h-full transition-all duration-150"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-[10px] text-slate-300 pt-0.5">
              <span>{currentState.distCoveredKm} km traveled</span>
              <span>{Math.max(0, totalDistanceKm - currentState.distCoveredKm)} km remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Simulation & Scrubber Control Bar */}
      <div className="p-4 sm:p-5 bg-surface border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
              isPlaying
                ? "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border border-amber-500/30"
                : "bg-accent text-white hover:bg-accent/90 shadow-md"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" /> Pause Live Feed
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Resume Truck Run
              </>
            )}
          </button>

          <button
            onClick={() => setProgress(0)}
            className="px-3 py-2 rounded-xl bg-surface border border-border hover:border-accent text-xs font-mono text-muted hover:text-foreground flex items-center gap-1 transition-colors"
            title="Restart Journey from Origin"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Restart</span>
          </button>

          {/* Speed multiplier selector */}
          <div className="flex items-center bg-background/80 p-0.5 rounded-xl border border-border text-[11px] font-mono">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  speedMultiplier === s
                    ? "bg-accent text-white font-bold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Live Scrubbing Slider */}
        <div className="flex items-center gap-3 w-full sm:flex-1 max-w-md">
          <span className="font-mono text-[11px] text-muted shrink-0 font-semibold">
            {Math.round(progress * 100)}%
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={progress}
            onChange={(e) => {
              setProgress(parseFloat(e.target.value));
            }}
            aria-label="Route Simulation Progress"
            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
          />
          <span className="font-mono text-[11px] text-muted shrink-0">
            {currentState.distCoveredKm}/{totalDistanceKm} km
          </span>
        </div>

        {/* ESG & Eco Savings badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-xs shrink-0">
          <Leaf className="w-3.5 h-3.5" />
          <span>420 kg CO₂ Avoided</span>
        </div>
      </div>
    </div>
  );
}
