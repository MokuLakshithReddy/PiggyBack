export type ShipmentPriority = "Low" | "Medium" | "High";

export type ShipmentStatus =
  | "Created"
  | "In Transit"
  | "Misplaced"
  | "Recovery Found"
  | "Recovered"
  | "Delivered"
  | "Pending"
  | "Assigned"
  | "Delayed";

export type Hub = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  code: string;
  state: string;
  isOperational: boolean;
  maintenanceWindow?: { startHour: number; endHour: number };
};

export type RouteSegment = {
  segmentId: string;
  fromNode: string;
  toNode: string;
  arrivalTime: string;
  departureTime: string;
  distanceKm: number;
};

export type Truck = {
  id: string;
  numberPlate: string;
  driverName: string;
  driverMobile: string;
  copassengerName: string;
  copassengerMobile: string;
  currentLocation: string;
  destination: string;
  capacity: number; // in kg
  availableCapacity: number; // in kg
  maxVolume: number; // in m³
  availableVolume: number; // in m³
  status: "Available" | "In Transit" | "Assigned" | "Maintenance" | "Delayed";
  schedule: RouteSegment[];
  currentDelayMinutes?: number;
};

export type Cargo = {
  id: string;
  shipmentId: string;
  description: string;
  weight: number; // kg
  volume: number; // m³
  origin: string;
  destination: string;
  priority: ShipmentPriority;
  specialHandling: string;
  status: "Loaded" | "In Transit" | "Delivered" | "Pending" | "Misrouted";
};

export type StaffShipment = {
  id: string;
  code: string;
  cargoId: string;
  origin: string;
  destination: string;
  priority: ShipmentPriority;
  weight: number;
  volume: number;
  deadline: string; // ISO String
  status: ShipmentStatus;
  assignedTruck: string | null;
  assignedRoute: string | null;
  currentLocation: string;
  plannedRoute: string[];
  disruptionReason?: string;
  disruptionTimestamp?: string;
  activePlanId?: string;
};

export enum RejectionReason {
  INSUFFICIENT_CAPACITY = "INSUFFICIENT_CAPACITY",
  WRONG_DESTINATION = "WRONG_DESTINATION",
  MISSED_DEPARTURE = "MISSED_DEPARTURE",
  DEADLINE_IMPOSSIBLE = "DEADLINE_IMPOSSIBLE",
  HUB_UNAVAILABLE = "HUB_UNAVAILABLE",
  TRANSFER_TIME_IMPOSSIBLE = "TRANSFER_TIME_IMPOSSIBLE",
  DOWNSTREAM_DELAY_EXCEEDED = "DOWNSTREAM_DELAY_EXCEEDED",
}

export type CandidateRoute = {
  id: string;
  shipmentId: string;
  vehicleId: string;
  pickupHub: string;
  dropoffHub: string;
  pickupTime: string;
  dropoffTime: string;
  pathMinWeight: number;
  pathMinVolume: number;
  isTransfer: boolean;
  transfers: number;
  transferHub?: string;
  downstreamDelayMinutes: number;
  delayMinutes: number;
  incrementalCost: number;
  distance: number;
  isFeasible: boolean;
  rejectionReason?: RejectionReason | null;
};

export type RejectedCandidateInfo = {
  candidateId: string;
  vehicleId: string;
  rejectionReason: string;
  pickupHub: string;
  dropoffHub: string;
};

export type DecisionReceipt = {
  planId?: string;
  shipmentId: string;
  status: "OPTIMAL" | "FEASIBLE" | "NO_FEASIBLE_PIGGYBACK";
  selectedVehicleId?: string;
  selectedCandidate?: CandidateRoute;
  weightCheckMargin?: number;
  timeCheckPickupMarginMinutes?: number;
  deliveryCheckSlaMarginMinutes?: number;
  downstreamRouteCheckDelayMinutes?: number;
  rejectedCandidates: RejectedCandidateInfo[];
  solveTimeMs: number;
  totalCandidatesEvaluated: number;
  feasibleCandidatesCount: number;
  createdAt: string;
  hash: string;
};

export type RecoveryPlan = {
  planId: string;
  shipmentId: string;
  strategy: "PRIMARY" | "SHADOW";
  status: "PENDING" | "APPROVED" | "EXECUTING" | "COMPLETED" | "INVALIDATED";
  vehicleId: string;
  pickupHub: string;
  dropoffHub: string;
  eta: string;
  incrementalCost: number;
  extraDistance: number;
  transfers: number;
  transferHub?: string;
  slaMarginMinutes: number;
  candidate: CandidateRoute;
  createdAt: string;
  co2SavedKg?: number;
  fuelSavedLiters?: number;
  emptyMilesAvertedKm?: number;
  baselineCharterCost?: number;
  costSavingsPercent?: number;
};

export type DisruptionType =
  | "delay_vehicle"
  | "close_hub"
  | "reduce_capacity"
  | "misroute_shipment";

export type DisruptionPayload = {
  disruptionType: DisruptionType;
  vehicleId?: string;
  hubId?: string;
  shipmentId?: string;
  delayMinutes?: number;
  capacityReductionPercent?: number;
  targetHub?: string;
  reason?: string;
};

export type DisruptionResult = {
  success: boolean;
  message: string;
  affectedShipmentIds: string[];
  affectedVehicleIds: string[];
  affectedHubIds: string[];
  stateVersion: number;
};

export type AutopsyReport = {
  shipmentId: string;
  disruptionType: string;
  rootCause: string;
  occurredAt: string;
  affectedHub: string;
  actualPlan: {
    eta: string;
    cost: number;
    distance: number;
    transfers: number;
    vehicleId: string;
  };
  baselinePlan?: {
    eta: string;
    cost: number;
    distance: number;
    transfers: number;
    vehicleId?: string;
  } | null;
  cascadeImpact: {
    affectedShipmentsCount: number;
    cumulativeDelayMinutes: number;
    costSavingsVsCharter: number;
    slaMaintained: boolean;
  };
  eventTimeline: Array<{
    timestamp: string;
    event: string;
    details: string;
  }>;
};
