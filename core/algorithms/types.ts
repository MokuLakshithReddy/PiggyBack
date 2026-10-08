import { GraphEdge } from "../graph/types";

export interface AlgorithmMetrics {
  algorithm: string;
  executionTimeMs: number;
  nodesExplored: number;
  edgesEvaluated: number;
  memoryEstimateBytes?: number;
}

export interface PathResult {
  source: string;
  target: string;
  path: string[]; // List of node IDs in sequence
  edges: GraphEdge[];
  totalDistanceKm: number;
  totalTravelTimeMin: number;
  totalRiskScore: number;
  totalCost: number;
  metrics: AlgorithmMetrics;
  feasible: boolean;
  rejectionReason?: string;
}

export type WeightFunction = (edge: GraphEdge) => number;

export interface PathfindingOptions {
  weightFn?: WeightFunction;
  avoidBlocked?: boolean;
  maxRiskThreshold?: number;
  maxDistanceKm?: number;
  maxTravelTimeMin?: number;
  requiredCapacityKg?: number;
}
