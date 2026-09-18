export type ShipmentPriority = "Low" | "Medium" | "High";

export type ShipmentStatus = "Created" | "In Transit" | "Misplaced" | "Recovery Found" | "Recovered" | "Delivered" | "Pending" | "Assigned" | "Delayed";

export type StaffShipment = {
  id: string;
  code: string;
  cargoId: string;
  origin: string;
  destination: string;
  priority: ShipmentPriority;
  weight: number;
  volume: number;
  deadline: string;
  status: ShipmentStatus;
  assignedTruck: string | null;
  assignedRoute: string | null;
  currentLocation: string;
};

export type Cargo = {
  id: string;
  shipmentId: string;
  description: string;
  weight: number;
  volume: number;
  origin: string;
  destination: string;
  priority: ShipmentPriority;
  specialHandling: string;
  status: "Loaded" | "In Transit" | "Delivered" | "Pending" | "Misrouted";
};

export type Truck = {
  id: string;
  numberPlate: string;
  driverName: string;
  driverMobile: string;
  copassengerName: string;
  copassengerMobile: string;
  destination: string;
  currentLocation: string;
  capacity: number;
  availableCapacity: number;
  status: "Available" | "In Transit" | "Assigned" | "Maintenance" | "Delayed";
};

export type DemoRoute = {
  id: string;
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  hubs: string[];
  truckId: string | null;
  status: "Active" | "Completed" | "Scheduled";
};

export type TrackingStep = {
  label: string;
  timestamp: string;
  completed: boolean;
  active: boolean;
};

export type TrackingResult = {
  shipment: StaffShipment;
  cargo: Cargo;
  steps: TrackingStep[];
  route: string[];
};

// Legacy types for backward compatibility with RecoveryDemo
export type Shipment = {
  id: string;
  currentLocation: string;
  destination: string;
  weight: number;
  volume: number;
  priority: ShipmentPriority;
  deadline: string;
};

export type Vehicle = {
  id: string;
  currentLocation: string;
  destination: string;
  capacity: number;
  availableCapacity: number;
};

export type Route = {
  id: string;
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
  vehicleId: string;
  hubIds: string[];
};

export type Hub = {
  id: string;
  name: string;
  location: string;
};

export type RecoveryOption = {
  shipmentId: string;
  vehicleId: string;
  routeId: string;
  compatible: boolean;
  availableCapacity: number;
  additionalDistance: number;
  estimatedArrival: string;
  recoveryCost: number;
  priority: ShipmentPriority;
  explanation: string;
};

export const CITIES = ["Delhi", "Mumbai", "Hyderabad", "Bengaluru", "Chennai", "Pune", "Kolkata"] as const;
