/**
 * Core Graph Data Structures and Type Definitions
 */

export type EdgeStatus = "ACTIVE" | "CONGESTED" | "BLOCKED";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GraphNode {
  id: string;
  name: string;
  coords: Coordinates;
  type?: "HUB" | "DEPOT" | "INTERCHANGE" | "SHELTER" | "WAYPOINT";
  capacity?: number;
  currentLoad?: number;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  distanceKm: number;
  travelTimeMin: number;
  riskScore: number; // 0.0 (safe) to 1.0 (extreme risk/hazard)
  capacityKg: number;
  currentLoadKg?: number;
  cost: number; // Base cost (financial/resource)
  status: EdgeStatus;
  bidirectional?: boolean;
  metadata?: Record<string, unknown>;
}

export interface GraphMetrics {
  totalNodes: number;
  totalEdges: number;
  activeEdges: number;
  blockedEdges: number;
  congestedEdges: number;
  averageDegree: number;
}
