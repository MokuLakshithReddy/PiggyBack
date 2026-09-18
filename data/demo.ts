import type {
  Hub,
  RecoveryOption,
  Route,
  Shipment,
  Vehicle,
} from "@/types";

export const demoShipment: Shipment = {
  id: "SHP-2048",
  currentLocation: "Hyderabad",
  destination: "Chennai",
  weight: 42,
  volume: 0.8,
  priority: "High",
  deadline: "2026-09-18T20:00:00+05:30",
};

export const hubs: Hub[] = [
  {
    id: "HUB-HYD",
    name: "Hyderabad Transfer",
    location: "Hyderabad",
  },
  {
    id: "HUB-BLR",
    name: "Bengaluru Cross-dock",
    location: "Bengaluru",
  },
  {
    id: "HUB-MAA",
    name: "Chennai Gateway",
    location: "Chennai",
  },
];

export const vehicles: Vehicle[] = [
  {
    id: "VEH-110",
    currentLocation: "Hyderabad",
    destination: "Chennai",
    capacity: 500,
    availableCapacity: 120,
  },
  {
    id: "VEH-221",
    currentLocation: "Bengaluru",
    destination: "Chennai",
    capacity: 200,
    availableCapacity: 30,
  },
  {
    id: "VEH-308",
    currentLocation: "Hyderabad",
    destination: "Chennai",
    capacity: 800,
    availableCapacity: 200,
  },
];

export const routes: Route[] = [
  {
    id: "RT-01",
    origin: "Hyderabad",
    destination: "Chennai",
    distance: 630,
    estimatedDuration: 660,
    vehicleId: "VEH-110",
    hubIds: ["HUB-HYD", "HUB-BLR", "HUB-MAA"],
  },
  {
    id: "RT-02",
    origin: "Bengaluru",
    destination: "Chennai",
    distance: 350,
    estimatedDuration: 360,
    vehicleId: "VEH-221",
    hubIds: ["HUB-BLR", "HUB-MAA"],
  },
  {
    id: "RT-03",
    origin: "Hyderabad",
    destination: "Chennai",
    distance: 625,
    estimatedDuration: 720,
    vehicleId: "VEH-308",
    hubIds: ["HUB-HYD", "HUB-MAA"],
  },
];

export const recoveryOptions: RecoveryOption[] = [
  {
    shipmentId: "SHP-2048",
    vehicleId: "VEH-110",
    routeId: "RT-01",
    compatible: true,
    availableCapacity: 120,
    additionalDistance: 18,
    estimatedArrival: "2026-09-18T18:40:00+05:30",
    recoveryCost: 1850,
    priority: "High",
    explanation:
      "A southbound vehicle already heading to Chennai has spare space and can collect the shipment in Hyderabad.",
  },
  {
    shipmentId: "SHP-2048",
    vehicleId: "VEH-221",
    routeId: "RT-02",
    compatible: false,
    availableCapacity: 30,
    additionalDistance: 42,
    estimatedArrival: "2026-09-18T17:10:00+05:30",
    recoveryCost: 1420,
    priority: "Medium",
    explanation:
      "The Bengaluru vehicle is on time for Chennai, but remaining space is below the shipment weight.",
  },
  {
    shipmentId: "SHP-2048",
    vehicleId: "VEH-308",
    routeId: "RT-03",
    compatible: false,
    availableCapacity: 200,
    additionalDistance: 12,
    estimatedArrival: "2026-09-18T22:15:00+05:30",
    recoveryCost: 2100,
    priority: "High",
    explanation:
      "This vehicle has room, but its estimated arrival is after the shipment deadline.",
  },
];
