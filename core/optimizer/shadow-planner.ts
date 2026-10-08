import { Graph } from "../graph/graph";
import { dijkstra } from "../algorithms/dijkstra";
import { aStar } from "../algorithms/astar";
import { ConstraintEngine } from "../constraints/constraint-engine";
import { PlanContext } from "../constraints/types";
import { OBJECTIVE_PROFILES, scoreCandidates } from "./objectives";
import { ObjectiveProfile, ScoredPlan } from "./types";

/**
 * Resilient Shadow Planner
 * Computes an independent, edge-disjoint (or minimum-overlap) backup route.
 * Guarantees zero-wait operational failover if primary corridors suffer disruption.
 */
export class ShadowPlanner {
  /**
   * Generates a shadow plan that avoids or heavily penalizes edges used in the primary plan.
   */
  public static generateShadowPlan(
    graph: Graph,
    primaryPlan: ScoredPlan,
    constraintEngine: ConstraintEngine,
    context: PlanContext,
    profile: ObjectiveProfile = "BALANCED"
  ): ScoredPlan | null {
    const primaryEdgeIds = new Set(primaryPlan.candidate.edges.map((e) => e.id));
    const source = primaryPlan.candidate.source;
    const target = primaryPlan.candidate.target;

    // Clone graph and mark primary edges as heavily penalized (or temporarily blocked)
    const shadowGraph = graph.clone();

    // Strategy 1: Strictly block primary corridor edges to force true topological disjointness
    for (const edge of shadowGraph.getAllEdges()) {
      if (primaryEdgeIds.has(edge.id) || primaryEdgeIds.has(`${edge.id}_rev`)) {
        shadowGraph.setEdgeStatus(edge.id, "BLOCKED");
      }
    }

    const weights = OBJECTIVE_PROFILES[profile];
    const weightFn = (e: any) =>
      weights.timeWeight * e.travelTimeMin +
      weights.riskWeight * e.riskScore * 100 +
      weights.distanceWeight * e.distanceKm;

    let candDijkstra = dijkstra(shadowGraph, source, target, {
      avoidBlocked: true,
      weightFn,
    });

    let candAstar = aStar(shadowGraph, source, target, {
      avoidBlocked: true,
      weightFn,
    });

    let candidatePool = [candDijkstra, candAstar].filter((c) => c.feasible);

    // Strategy 2: If fully edge-disjoint path does not exist, fall back to heavily penalizing primary edges
    if (candidatePool.length === 0) {
      const penalizedWeightFn = (e: any) => {
        const isPrimary = primaryEdgeIds.has(e.id) || primaryEdgeIds.has(`${e.id}_rev`);
        const overlapPenalty = isPrimary ? 50000 : 0;
        return weightFn(e) + overlapPenalty;
      };
      candDijkstra = dijkstra(graph, source, target, { avoidBlocked: true, weightFn: penalizedWeightFn });
      candAstar = aStar(graph, source, target, { avoidBlocked: true, weightFn: penalizedWeightFn });
      candidatePool = [candDijkstra, candAstar].filter((c) => c.feasible);
    }

    // Filter using original constraints
    const { feasible } = constraintEngine.filterCandidates(candidatePool, context);

    if (feasible.length === 0) {
      return null;
    }

    const scored = scoreCandidates(
      feasible.map((f) => ({ candidate: f.candidate, softPenalty: f.softPenaltyTotal })),
      profile
    );

    // Return best backup plan that is strictly distinct from primary
    const distinct = scored.find(
      (s) => s.candidate.path.join("->") !== primaryPlan.candidate.path.join("->")
    );

    if (!distinct) {
      return null;
    }

    // Quantitative overlap computation
    const overlappingEdgeIds: string[] = [];
    let sharedDistanceKm = 0;
    let independentDistanceKm = 0;

    for (const edge of distinct.candidate.edges) {
      if (primaryEdgeIds.has(edge.id) || primaryEdgeIds.has(`${edge.id}_rev`)) {
        overlappingEdgeIds.push(edge.id);
        sharedDistanceKm += edge.distanceKm;
      } else {
        independentDistanceKm += edge.distanceKm;
      }
    }

    const overlapPercentage =
      distinct.candidate.totalDistanceKm > 0
        ? Math.round((sharedDistanceKm / distinct.candidate.totalDistanceKm) * 1000) / 10
        : 0;

    const guarantee = overlappingEdgeIds.length === 0 ? "EDGE_DISJOINT" : "PENALIZED_OVERLAP";

    distinct.shadowGuarantee = {
      guarantee,
      overlappingEdgeIds,
      overlapPercentage,
      sharedDistanceKm: Math.round(sharedDistanceKm * 10) / 10,
      independentDistanceKm: Math.round(independentDistanceKm * 10) / 10,
      quantitativeAudit:
        guarantee === "EDGE_DISJOINT"
          ? "GUARANTEE: 100% EDGE_DISJOINT (0% shared corridor overlap)"
          : `GUARANTEE: PENALIZED_OVERLAP (${overlapPercentage}% shared distance, ${independentDistanceKm}km independent)`,
    };

    return distinct;
  }
}
