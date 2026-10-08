import { PathResult } from "../algorithms/types";
import { FilterResult } from "../constraints/types";

export type ObjectiveProfile = "FASTEST" | "SAFEST" | "BALANCED" | "ECONOMY" | "CUSTOM";

export interface ObjectiveWeights {
  distanceWeight: number; // α
  timeWeight: number;     // β
  riskWeight: number;     // γ
  costWeight: number;     // δ
  congestionWeight?: number; // ε
}

export interface ScoredPlan {
  id: string;
  candidate: PathResult;
  compositeScore: number;
  normalizedScores: {
    distance: number;
    time: number;
    risk: number;
    cost: number;
  };
  weights: ObjectiveWeights;
  profile: ObjectiveProfile;
  isParetoOptimal: boolean;
  paretoRank: number; // 1 = non-dominated frontier, 2 = 2nd frontier, etc.
  softPenalty: number;
  shadowGuarantee?: ShadowGuaranteeMetrics;
}

export type ShadowGuaranteeType = "EDGE_DISJOINT" | "PENALIZED_OVERLAP" | "NONE";

export interface ShadowGuaranteeMetrics {
  guarantee: ShadowGuaranteeType;
  overlappingEdgeIds: string[];
  overlapPercentage: number; // 0% for edge-disjoint, >0% for penalized overlap
  sharedDistanceKm: number;
  independentDistanceKm: number;
  quantitativeAudit: string;
}

export interface TradeOffItem {
  alternativeId: string;
  alternativeProfile: string;
  timeDiffMinutes: number;
  timeDiffPercent: number;
  riskDiffPercent: number;
  costDiffPercent: number;
  distanceDiffKm: number;
  summary: string;
}

export interface TradeOffReport {
  recommendedPlanId: string;
  kneePointPlanId?: string;
  comparisonItems: TradeOffItem[];
  keyTradeOffSummary: string;
}

export interface OptimizationResult {
  status: "OPTIMAL" | "FEASIBLE" | "INFEASIBLE";
  primaryPlan: ScoredPlan | null;
  shadowPlan: ScoredPlan | null;
  shadowGuarantee?: ShadowGuaranteeMetrics;
  paretoFrontier: ScoredPlan[];
  allFeasiblePlans: ScoredPlan[];
  infeasiblePlans: FilterResult[];
  rejectionBreakdown: Record<string, number>;
  explanation: string;
  tradeOffReport: TradeOffReport;
  metrics: {
    solveTimeMs: number;
    totalCandidates: number;
    feasibleCandidates: number;
    paretoFrontierCount: number;
  };
}
