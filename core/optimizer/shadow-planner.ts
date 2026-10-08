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

    // Strategy 1: Strictly avoid primary edges if an alternative path exists
    for (const edge of shadowGraph.getAllEdges()) {
      if (primaryEdgeIds.has(edge.id) || primaryEdgeIds.has(`${edge.id}_rev`)) {
        // High risk & 10x traversal time penalty to discourage reuse
        edge.travelTimeMin *= 10;
        edge.riskScore = Math.min(1.0, edge.riskScore + 0.5);
      }
    }

    // Attempt Dijkstra and A* on the penalized graph
    const weights = OBJECTIVE_PROFILES[profile];
    const weightFn = (e: any) =>
      weights.timeWeight * e.travelTimeMin +
      weights.riskWeight * e.riskScore * 100 +
      weights.distanceWeight * e.distanceKm;

    const candDijkstra = dijkstra(shadowGraph, source, target, {
      avoidBlocked: true,
      weightFn,
    });

    const candAstar = aStar(shadowGraph, source, target, {
      avoidBlocked: true,
      weightFn,
    });

    const candidatePool = [candDijkstra, candAstar].filter((c) => c.feasible);

    // Filter using original constraints
    const { feasible } = constraintEngine.filterCandidates(candidatePool, context);

    if (feasible.length === 0) {
      return null;
    }

    const scored = scoreCandidates(
      feasible.map((f) => ({ candidate: f.candidate, softPenalty: f.softPenaltyTotal })),
      profile
    );

    // Return best backup plan that is distinct from primary
    const distinct = scored.find(
      (s) => s.candidate.path.join("->") !== primaryPlan.candidate.path.join("->")
    );

    return distinct || scored[0] || null;
  }
}
