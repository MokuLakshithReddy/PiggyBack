import { Graph } from "../graph/graph";
import { PathResult } from "../algorithms/types";
import { bfs } from "../algorithms/bfs";
import { dijkstra } from "../algorithms/dijkstra";
import { aStar } from "../algorithms/astar";
import { greedySearch } from "../algorithms/greedy";
import { ConstraintEngine } from "../constraints/constraint-engine";
import { PlanContext } from "../constraints/types";
import { OBJECTIVE_PROFILES, scoreCandidates } from "./objectives";
import { computeParetoFrontier } from "./pareto";
import { ShadowPlanner } from "./shadow-planner";
import { DecisionExplainer } from "./explainer";
import { ObjectiveProfile, ObjectiveWeights, OptimizationResult, ScoredPlan } from "./types";

export interface OptimizerOptions {
  profile?: ObjectiveProfile;
  customWeights?: Partial<ObjectiveWeights>;
  enableShadowPlan?: boolean;
  extraCandidates?: PathResult[];
}

/**
 * PiggyBack Flagship Optimization Engine
 *
 * Pipeline:
 *  1. Multi-Algorithm Candidate Generation (BFS, Dijkstra [Distance/Time/Risk], A*, Greedy)
 *  2. Constraint Gate & Feasibility Filtering (Capacity, SLA, Risk Ceilings, Status)
 *  3. Multi-Objective Scalarization & Pareto Non-Dominated Sorting
 *  4. Primary Plan Selection (Knee-point / Best Profile match)
 *  5. Resilient Shadow Plan Generation (Edge-disjoint failover)
 *  6. Explainable Decision Generation (Mathematical trade-off proofs)
 */
export class PiggyBackOptimizer {
  private graph: Graph;
  private constraintEngine: ConstraintEngine;

  constructor(graph: Graph, constraintEngine?: ConstraintEngine) {
    this.graph = graph;
    this.constraintEngine = constraintEngine || new ConstraintEngine();
  }

  public getConstraintEngine(): ConstraintEngine {
    return this.constraintEngine;
  }

  /**
   * Generates candidate paths using diverse algorithms and objective weightings.
   */
  public generateCandidates(source: string, target: string): PathResult[] {
    const candidates: PathResult[] = [];

    // 1. BFS (Hop/Transfer-minimizing baseline)
    candidates.push(bfs(this.graph, source, target));

    // 2. Dijkstra (Distance minimizing)
    candidates.push(
      dijkstra(this.graph, source, target, {
        weightFn: (e) => e.distanceKm,
      })
    );

    // 3. Dijkstra (Time minimizing)
    candidates.push(
      dijkstra(this.graph, source, target, {
        weightFn: (e) => e.travelTimeMin,
      })
    );

    // 4. Dijkstra (Risk minimizing)
    candidates.push(
      dijkstra(this.graph, source, target, {
        weightFn: (e) => e.riskScore * 100 + e.travelTimeMin * 0.1,
      })
    );

    // 5. A* (Spatial Euclidean/Haversine heuristic)
    candidates.push(aStar(this.graph, source, target));

    // 6. Greedy Best-First (Locally optimal baseline)
    candidates.push(greedySearch(this.graph, source, target));

    // Deduplicate candidate paths by sequence of nodes
    const uniqueMap = new Map<string, PathResult>();
    for (const c of candidates) {
      if (c.feasible && c.path.length > 0) {
        const key = c.path.join("->");
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, c);
        }
      }
    }

    return Array.from(uniqueMap.values());
  }

  /**
   * Executes the full PiggyBack optimization pipeline.
   */
  public solve(
    source: string,
    target: string,
    context: PlanContext,
    options: OptimizerOptions = {}
  ): OptimizationResult {
    const startTime = performance.now();
    const profile = options.profile ?? "BALANCED";
    const enableShadow = options.enableShadowPlan ?? true;

    // 1. Candidate Generation
    let candidates = this.generateCandidates(source, target);
    if (options.extraCandidates && options.extraCandidates.length > 0) {
      candidates = [...candidates, ...options.extraCandidates];
    }

    // 2. Constraint Filtering
    const { feasible, infeasible, rejectionBreakdown } = this.constraintEngine.filterCandidates(
      candidates,
      context
    );

    if (feasible.length === 0) {
      const solveTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
      return {
        status: "INFEASIBLE",
        primaryPlan: null,
        shadowPlan: null,
        paretoFrontier: [],
        allFeasiblePlans: [],
        infeasiblePlans: infeasible,
        rejectionBreakdown,
        explanation: "No feasible plan found satisfying all active hard constraints.",
        tradeOffReport: {
          recommendedPlanId: "NONE",
          comparisonItems: [],
          keyTradeOffSummary: "Infeasible solution space",
        },
        metrics: {
          solveTimeMs,
          totalCandidates: candidates.length,
          feasibleCandidates: 0,
          paretoFrontierCount: 0,
        },
      };
    }

    // 3. Multi-objective scoring
    const scoredPlans = scoreCandidates(
      feasible.map((f) => ({ candidate: f.candidate, softPenalty: f.softPenaltyTotal })),
      profile,
      options.customWeights
    );

    // 4. Pareto Frontier analysis
    const { frontier, rankedPlans, kneePoint } = computeParetoFrontier(scoredPlans);

    // Primary Plan selection:
    // If BALANCED, recommend knee point; otherwise recommend best score matching the profile
    const primaryPlan: ScoredPlan =
      profile === "BALANCED" && kneePoint ? kneePoint : rankedPlans[0];

    // 5. Resilient Shadow Plan Generation
    let shadowPlan: ScoredPlan | null = null;
    if (enableShadow && primaryPlan) {
      shadowPlan = ShadowPlanner.generateShadowPlan(
        this.graph,
        primaryPlan,
        this.constraintEngine,
        context,
        profile
      );
    }

    // 6. Explainable Decision & Mathematical Justifications
    const { explanation, tradeOffReport } = DecisionExplainer.explainDecision(
      primaryPlan,
      frontier,
      context
    );

    const solveTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      status: "OPTIMAL",
      primaryPlan,
      shadowPlan,
      paretoFrontier: frontier,
      allFeasiblePlans: rankedPlans,
      infeasiblePlans: infeasible,
      rejectionBreakdown,
      explanation,
      tradeOffReport,
      metrics: {
        solveTimeMs,
        totalCandidates: candidates.length,
        feasibleCandidates: feasible.length,
        paretoFrontierCount: frontier.length,
      },
    };
  }
}
