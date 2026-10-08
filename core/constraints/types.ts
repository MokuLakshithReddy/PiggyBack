import { PathResult } from "../algorithms/types";

export type ConstraintType =
  | "CAPACITY"
  | "DEADLINE"
  | "RISK_CEILING"
  | "ROAD_STATUS"
  | "PRIORITY"
  | "VEHICLE_AVAILABILITY"
  | "CUSTOM";

export interface PlanContext {
  cargoWeightKg: number;
  cargoVolumeM3?: number;
  priorityLevel: 1 | 2 | 3; // 1 = Critical, 2 = High, 3 = Standard
  slaDeadlineMinutes: number; // Max allowed minutes from dispatch
  maxAcceptableRiskScore?: number; // 0.0 to 1.0
  requiredSpecialHandling?: ("COLD_CHAIN" | "HAZMAT" | "FRAGILE")[];
  currentTimestamp?: string;
}

export interface ConstraintValidation {
  satisfied: boolean;
  reason?: string;
  penaltyScore?: number; // For soft constraints
}

export interface ConstraintRule {
  id: string;
  name: string;
  type: ConstraintType;
  isHard: boolean; // Hard constraint = disqualifies route. Soft constraint = applies penalty.
  validate: (candidate: PathResult, context: PlanContext) => ConstraintValidation;
}

export interface FilterResult {
  candidate: PathResult;
  isFeasible: boolean;
  violatedConstraints: string[];
  softPenaltyTotal: number;
}
