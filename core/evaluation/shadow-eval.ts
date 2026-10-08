import { Graph } from "../graph/graph";
import { buildPanIndiaLogisticsGraph } from "../graph/adapter";
import { generateSyntheticGraph } from "../graph/synthetic-generator";
import { PiggyBackOptimizer } from "../optimizer/optimizer";
import { PlanContext } from "../constraints/types";

export interface ShadowEvaluationMetrics {
  totalScenariosEvaluated: number;
  edgeDisjointCount: number;
  penalizedOverlapCount: number;
  edgeDisjointPercent: number;
  fallbackPercent: number;
  averageOverlapPercentOnFallback: number;
  averageRuntimeMs: number;
  averageIndependentDistanceKm: number;
  averageSharedDistanceKm: number;
}

/**
 * Shadow Planner Evaluation Suite
 * Quantitatively measures disjointness %, fallback %, overlap %, and runtime across diverse topologies.
 */
export class ShadowPlannerEvaluator {
  public static runEvaluation(trials: number = 50): ShadowEvaluationMetrics {
    let edgeDisjointCount = 0;
    let fallbackCount = 0;
    let totalOverlapPctSum = 0;
    let totalRuntimeMs = 0;
    let totalIndepDistSum = 0;
    let totalSharedDistSum = 0;
    let successfulEvaluations = 0;

    const panIndiaHubs = [
      "Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad",
      "Ahmedabad", "Pune", "Jaipur", "Lucknow", "Nagpur", "Bhopal",
      "Indore", "Chandigarh", "Patna", "Bhubaneswar", "Visakhapatnam",
      "Coimbatore", "Kochi", "Guwahati"
    ];

    for (let t = 0; t < trials; t++) {
      let graph: Graph;
      let src: string;
      let tgt: string;

      if (t % 2 === 0) {
        graph = buildPanIndiaLogisticsGraph();
        src = panIndiaHubs[t % panIndiaHubs.length];
        tgt = panIndiaHubs[(t + 5) % panIndiaHubs.length];
      } else {
        const numNodes = 40 + (t % 30);
        graph = generateSyntheticGraph({
          numNodes,
          averageDegree: 5,
          blockedRate: 0.05,
          seed: 3300 + t * 41,
        });
        src = "NODE-0";
        tgt = `NODE-${numNodes - 1}`;
      }

      const context: PlanContext = {
        cargoWeightKg: 300,
        priorityLevel: 2,
        slaDeadlineMinutes: 4000,
      };

      const optimizer = new PiggyBackOptimizer(graph);
      const start = performance.now();
      const res = optimizer.solve(src, tgt, context, { enableShadowPlan: true });
      const elapsed = performance.now() - start;

      if (res.status === "OPTIMAL" && res.shadowPlan) {
        successfulEvaluations++;
        totalRuntimeMs += elapsed;

        const g = res.shadowGuarantee || res.shadowPlan.shadowGuarantee;
        if (g?.guarantee === "EDGE_DISJOINT") {
          edgeDisjointCount++;
          totalIndepDistSum += g.independentDistanceKm || res.shadowPlan.candidate.totalDistanceKm;
        } else {
          fallbackCount++;
          const overlap = g?.overlapPercentage || 0;
          totalOverlapPctSum += overlap;
          totalSharedDistSum += g?.sharedDistanceKm || 0;
          totalIndepDistSum += g?.independentDistanceKm || 0;
        }
      }
    }

    const validTotal = Math.max(1, successfulEvaluations);
    const validFallback = Math.max(1, fallbackCount);

    return {
      totalScenariosEvaluated: trials,
      edgeDisjointCount,
      penalizedOverlapCount: fallbackCount,
      edgeDisjointPercent: Math.round((edgeDisjointCount / validTotal) * 1000) / 10,
      fallbackPercent: Math.round((fallbackCount / validTotal) * 1000) / 10,
      averageOverlapPercentOnFallback: Math.round((totalOverlapPctSum / validFallback) * 10) / 10,
      averageRuntimeMs: Math.round((totalRuntimeMs / validTotal) * 100) / 100,
      averageIndependentDistanceKm: Math.round(totalIndepDistSum / validTotal),
      averageSharedDistanceKm: Math.round(totalSharedDistSum / validFallback),
    };
  }
}
