"use client";

import type { DemoRoute, TrackingResult, TrackingStep } from "@/types";
import type { StaffShipment, Cargo, Truck } from "./engine/types";
import { SEED_ROUTES } from "@/data/seed";
import { stateManager } from "./engine/state-manager";

// ─── Keys ───────────────────────────────────────────────────────
const KEYS = {
  routes: "pgb_routes",
  auth: "pgb_auth",
  counters: "pgb_counters",
} as const;

function read<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, data: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function readCounters(): { shipment: number; cargo: number } {
  if (typeof window === "undefined") return { shipment: 2056, cargo: 78439 };
  try {
    const raw = localStorage.getItem(KEYS.counters);
    return raw ? JSON.parse(raw) : { shipment: 2056, cargo: 78439 };
  } catch {
    return { shipment: 2056, cargo: 78439 };
  }
}

function writeCounters(c: { shipment: number; cargo: number }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.counters, JSON.stringify(c));
}

// ─── Shipments ──────────────────────────────────────────────────
export function getShipments(): StaffShipment[] {
  return stateManager.getShipments();
}

export function getShipment(id: string): StaffShipment | undefined {
  return stateManager.getShipment(id);
}

export function createShipment(input: {
  origin: string;
  destination: string;
  priority: StaffShipment["priority"];
  weight: number;
  volume: number;
  deadline: string;
  cargoDescription: string;
}): { shipment: StaffShipment; cargo: Cargo } {
  const counters = readCounters();
  const shipmentId = `SHP-${counters.shipment}`;
  const prefix = input.origin.slice(0, 3).toUpperCase();
  const suffix = String.fromCharCode(65 + (counters.shipment % 26)) + (counters.shipment % 10);
  const code = `PGB-${prefix}-${counters.shipment}-${suffix}`;
  const cargoId = `CRG-${counters.cargo}`;

  const shipment: StaffShipment = {
    id: shipmentId,
    code,
    cargoId,
    ...input,
    status: "Created",
    assignedTruck: null,
    assignedRoute: null,
    currentLocation: input.origin,
    plannedRoute: [input.origin, input.destination],
  };

  const cargo: Cargo = {
    id: cargoId,
    shipmentId,
    description: input.cargoDescription,
    weight: input.weight,
    volume: input.volume,
    origin: input.origin,
    destination: input.destination,
    priority: input.priority,
    specialHandling: "None",
    status: "Pending",
  };

  // We add to stateManager through custom internal or save
  const existingShipments = stateManager.getShipments();
  existingShipments.push(shipment);
  if (typeof window !== "undefined") {
    localStorage.setItem("pgb_mosaic_shipments", JSON.stringify(existingShipments));
  }

  const existingCargo = stateManager.getCargo();
  existingCargo.push(cargo);
  if (typeof window !== "undefined") {
    localStorage.setItem("pgb_mosaic_cargo", JSON.stringify(existingCargo));
  }

  writeCounters({ shipment: counters.shipment + 1, cargo: counters.cargo + 1 });
  return { shipment, cargo };
}

export function updateShipment(id: string, patch: Partial<StaffShipment>) {
  const updated = stateManager.getShipments().map((s) => (s.id === id ? { ...s, ...patch } : s));
  if (typeof window !== "undefined") {
    localStorage.setItem("pgb_mosaic_shipments", JSON.stringify(updated));
  }
}

// ─── Cargo ──────────────────────────────────────────────────────
export function getCargo(): Cargo[] {
  return stateManager.getCargo();
}

export function createCargo(input: Omit<Cargo, "id">): Cargo {
  const counters = readCounters();
  const cargo: Cargo = { id: `CRG-${counters.cargo}`, ...input };
  const list = getCargo();
  list.push(cargo);
  if (typeof window !== "undefined") {
    localStorage.setItem("pgb_mosaic_cargo", JSON.stringify(list));
  }
  writeCounters({ shipment: counters.shipment, cargo: counters.cargo + 1 });
  return cargo;
}

// ─── Trucks ─────────────────────────────────────────────────────
export function getTrucks(): Truck[] {
  return stateManager.getTrucks();
}

export function getTruck(id: string): Truck | undefined {
  return stateManager.getTruck(id);
}

export function createTruck(input: any): Truck {
  const list = getTrucks();
  const nextNum = list.length + 1;
  const truck: Truck = {
    status: "Available",
    maxVolume: 35,
    availableVolume: 20,
    schedule: [],
    ...input,
    id: `TRK-${String(nextNum).padStart(3, "0")}`,
  };
  list.push(truck);
  if (typeof window !== "undefined") {
    localStorage.setItem("pgb_mosaic_trucks", JSON.stringify(list));
  }
  return truck;
}

export function assignShipmentToTruck(shipmentId: string, truckId: string) {
  const shipment = getShipment(shipmentId);
  const truck = getTruck(truckId);
  if (!shipment || !truck) return;

  updateShipment(shipmentId, {
    assignedTruck: truck.numberPlate,
    status: "Assigned",
    currentLocation: truck.currentLocation,
  });
}

// ─── Routes ─────────────────────────────────────────────────────
export function getRoutes(): DemoRoute[] {
  return read<DemoRoute>(KEYS.routes, SEED_ROUTES);
}

// ─── Auth ───────────────────────────────────────────────────────
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEYS.auth) === "true";
}

export function setAuthenticated(val: boolean) {
  if (typeof window === "undefined") return;
  if (val) localStorage.setItem(KEYS.auth, "true");
  else localStorage.removeItem(KEYS.auth);
}

// ─── Tracking ───────────────────────────────────────────────────
export function getTrackingResult(id: string): TrackingResult | null {
  const shipment = getShipment(id);
  if (!shipment) return null;
  const cargo = getCargo().find((c) => c.shipmentId === shipment.id) || {
    id: shipment.cargoId,
    shipmentId: shipment.id,
    description: "Standard Freight Parcel",
    weight: shipment.weight,
    volume: shipment.volume,
    origin: shipment.origin,
    destination: shipment.destination,
    priority: shipment.priority,
    specialHandling: "None",
    status: shipment.status === "Delivered" ? "Delivered" : "In Transit",
  };

  const statusOrder: StaffShipment["status"][] = [
    "Created",
    "In Transit",
    "Delayed",
    "Misplaced",
    "Recovery Found",
    "Recovered",
    "Delivered",
  ];
  const currentIdx = statusOrder.indexOf(shipment.status);

  const steps: TrackingStep[] = [
    { label: "Order Created", timestamp: "Scheduled Dispatch", completed: currentIdx >= 0, active: currentIdx === 0 },
    { label: "In Transit", timestamp: "Hub Handover", completed: currentIdx >= 1, active: currentIdx === 1 },
    {
      label: shipment.status === "Delayed" ? "Carrier Delay Detected" : "Misplaced / Diverted",
      timestamp: shipment.disruptionTimestamp ? new Date(shipment.disruptionTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Disruption Event",
      completed: currentIdx >= 2,
      active: currentIdx === 2 || currentIdx === 3,
    },
    {
      label: "MOSAIC Piggyback Matched",
      timestamp: shipment.assignedTruck ? `Assigned to ${shipment.assignedTruck}` : "Optimizer Solving",
      completed: currentIdx >= 4,
      active: currentIdx === 4,
    },
    { label: "On Recovery Route", timestamp: `Via ${shipment.currentLocation}`, completed: currentIdx >= 5, active: currentIdx === 5 },
    { label: "Delivered", timestamp: `Deadline: ${new Date(shipment.deadline).toLocaleDateString([], { month: "short", day: "numeric" })}`, completed: currentIdx >= 6, active: currentIdx === 6 },
  ];

  const route = shipment.plannedRoute && shipment.plannedRoute.length > 0
    ? shipment.plannedRoute
    : [shipment.origin, shipment.currentLocation, shipment.destination];

  return { shipment, cargo, steps, route };
}

// ─── Search ─────────────────────────────────────────────────────
export function searchShipments(query: string): StaffShipment[] {
  const q = query.toLowerCase().trim();
  if (!q) return getShipments();
  return getShipments().filter(
    (s) =>
      s.id.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.cargoId.toLowerCase().includes(q) ||
      (s.assignedTruck?.toLowerCase().includes(q) ?? false) ||
      s.origin.toLowerCase().includes(q) ||
      s.destination.toLowerCase().includes(q)
  );
}
