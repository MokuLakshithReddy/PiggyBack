import { PathResult } from "../algorithms/types";
import { ScoredPlan } from "../optimizer/types";

export type ReplanningMode = "SHADOW_FAILOVER" | "INCREMENTAL_LOCAL_REPAIR" | "FULL_RECOMPUTE";

export interface ReplanningBenchmarkComparison {
  fullRecomputeTimeMs: number;
  fullRecomputeNodesExplored: number;
  incrementalRepairTimeMs: number;
  incrementalRepairNodesExplored: number;
  shadowFailoverTimeMs: number;
  speedupVsFullRecompute: number;
  qualityComparison: {
    fullRecomputeCost: number;
    incrementalRepairCost: number;
    costDivergencePct: number;
  };
}

export interface ReplanningResult {
  strategyUsed: ReplanningMode;
  newPlan: ScoredPlan;
  executionTimeMs: number;
  nodesExplored: number;
  disruptionResolved: string;
  benchmark?: ReplanningBenchmarkComparison;
}
