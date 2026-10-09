import { Graph } from "../graph/graph";
import { generateSyntheticGraph } from "../graph/synthetic-generator";
import { buildPanIndiaLogisticsGraph } from "../graph/adapter";
import { yenKShortestPaths } from "../algorithms/yen-k-paths";
import { dijkstra } from "../algorithms/dijkstra";
import { aStar } from "../algorithms/astar";
import { bfs } from "../algorithms/bfs";
import { greedySearch } from "../algorithms/greedy";
import { PathResult } from "../algorithms/types";
import { ConstraintEngine } from "../constraints/constraint-engine";
import { PlanContext } from "../constraints/types";
import { scoreCandidates } from "../optimizer/objectives";
import { computeParetoFrontier } from "../optimizer/pareto";
import { ScoredPlan } from "../optimizer/types";

export interface DiversityExperimentPoint {
  K: number;
  candidateCount: number;
  feasibleCandidates: number;
  paretoFrontierSize: number;
  solutionQualityScore: number; // Lower composite score = higher quality
  runtimeMs: number;
  bestDistanceKm: number;
  bestTravelTimeMin: number;
}

export interface DiversityExperimentReport {
  timestamp: string;
  evaluatedKValues: number[];
  results: DiversityExperimentPoint[];
  insights: {
    optimalK: number;
    diminishingReturnsThreshold: number;
    paretoExpansionRatio: number;
    runtimeScalingFactor: number;
  };
}

/**
 * Generates a diverse pool of candidate paths targeting cardinality K.
 * Employs Yen's KSP alongside multi-attribute heuristic diversions.
 */
export function generateDiverseCandidates(
  graph: Graph,
  source: string,
  target: string,
  K: number
): PathResult[] {
  const candidateMap = new Map<string, PathResult>();

  // 1. Foundational baseline routes
  const baselines = [
    bfs(graph, source, target),
    dijkstra(graph, source, target, { weightFn: (e) => e.distanceKm }),
    dijkstra(graph, source, target, { weightFn: (e) => e.travelTimeMin }),
    dijkstra(graph, source, target, { weightFn: (e) => e.riskScore * 100 + e.travelTimeMin * 0.1 }),
    aStar(graph, source, target),
    greedySearch(graph, source, target),
  ];

  for (const b of baselines) {
    if (b.feasible && b.path.length > 0) {
      candidateMap.set(b.path.join("->"), b);
    }
  }

  // 2. Yen's K-Shortest Loopless Paths on distance and travel time
  const kspDistance = yenKShortestPaths(graph, source, target, Math.min(K, 25), {
    weightFn: (e) => e.distanceKm,
  });
  for (const p of kspDistance) {
    if (p.feasible && p.path.length > 0) {
      candidateMap.set(p.path.join("->"), p);
    }
  }

  // 3. Iterative Edge-Penalty Diversification (Chondrogiannis et al.)
  const edgePenalties = new Map<string, number>();
  let iteration = 0;
  const maxIterations = Math.max(K * 2, 50);

  while (candidateMap.size < K && iteration < maxIterations) {
    iteration++;
    const alpha = ((iteration * 7) % 10) / 10;
    const beta = 1 - alpha;

    const diversifiedWeight = (e: any) => {
      const penalty = edgePenalties.get(e.id) || 1.0;
      const baseCost = alpha * e.distanceKm + beta * (e.travelTimeMin * 1.2) + e.riskScore * 80;
      return baseCost * penalty;
    };

    const cand = dijkstra(graph, source, target, { weightFn: diversifiedWeight });
    if (cand.feasible && cand.path.length > 0) {
      const pathKey = cand.path.join("->");
      if (!candidateMap.has(pathKey)) {
        candidateMap.set(pathKey, cand);
      }
      // Penalize traversed edges by 40% to force alternate corridor discovery
      for (const e of cand.edges) {
        edgePenalties.set(e.id, (edgePenalties.get(e.id) || 1.0) * 1.4);
      }
    } else {
      break;
    }
  }

  return Array.from(candidateMap.values()).slice(0, K);
}

/**
 * Candidate Diversity Experiment Engine
 * Evaluates trade-offs across K in [5, 10, 25, 50, 100].
 */
export class CandidateDiversityExperiment {
  public static runExperiment(
    kValues: number[] = [5, 10, 25, 50, 100],
    scenarioCount: number = 5
  ): DiversityExperimentReport {
    const rawResults: Map<number, DiversityExperimentPoint[]> = new Map();

    for (const k of kValues) {
      rawResults.set(k, []);
    }

    const constraintEngine = new ConstraintEngine();

    // Run across multiple diverse scenario topologies
    for (let s = 0; s < scenarioCount; s++) {
      let graph: Graph;
      let src: string;
      let tgt: string;

      if (s === 0) {
        // Pan-India real network
        graph = buildPanIndiaLogisticsGraph();
        src = "Delhi";
        tgt = "Chennai";
      } else {
        // Synthetic network with realistic degree and congestion
        const numNodes = 40 + s * 10;
        graph = generateSyntheticGraph({
          numNodes,
          averageDegree: 5,
          blockedRate: 0.04,
          congestedRate: 0.10,
          seed: 4200 + s * 73,
        });
        src = "NODE-0";
        tgt = `NODE-${numNodes - 1}`;
      }

      // Compute baseline shortest path to set realistic SLA context
      const baselineShortest = dijkstra(graph, src, tgt);
      const baselineTime = baselineShortest.feasible ? baselineShortest.totalTravelTimeMin : 1500;

      const context: PlanContext = {
        cargoWeightKg: 400,
        priorityLevel: 2,
        slaDeadlineMinutes: Math.round(baselineTime * 2.5),
      };

      for (const K of kValues) {
        const start = performance.now();

        // 1. Generate diverse candidates
        const candidates = generateDiverseCandidates(graph, src, tgt, K);

        // 2. Filter feasible candidates
        const { feasible } = constraintEngine.filterCandidates(candidates, context);

        // 3. Multi-objective scoring
        let frontierSize = 0;
        let qualityScore = 999;
        let bestDist = 0;
        let bestTime = 0;

        if (feasible.length > 0) {
          const scored = scoreCandidates(
            feasible.map((f) => ({ candidate: f.candidate, softPenalty: f.softPenaltyTotal })),
            "BALANCED"
          );
          const { frontier, kneePoint, rankedPlans } = computeParetoFrontier(scored);
          frontierSize = frontier.length;
          const chosen: ScoredPlan = kneePoint || rankedPlans[0];
          qualityScore = chosen.compositeScore;
          bestDist = chosen.candidate.totalDistanceKm;
          bestTime = chosen.candidate.totalTravelTimeMin;
        }

        const runtimeMs = Math.round((performance.now() - start) * 100) / 100;

        rawResults.get(K)!.push({
          K,
          candidateCount: candidates.length,
          feasibleCandidates: feasible.length,
          paretoFrontierSize: frontierSize,
          solutionQualityScore: qualityScore,
          runtimeMs,
          bestDistanceKm: bestDist,
          bestTravelTimeMin: bestTime,
        });
      }
    }

    // Compute averaged metrics per K
    const aggregatedResults: DiversityExperimentPoint[] = kValues.map((K) => {
      const pts = rawResults.get(K)!;
      const count = pts.length;
      return {
        K,
        candidateCount: Math.round(pts.reduce((sum, p) => sum + p.candidateCount, 0) / count),
        feasibleCandidates: Math.round(pts.reduce((sum, p) => sum + p.feasibleCandidates, 0) / count),
        paretoFrontierSize: Math.max(1, Math.round(pts.reduce((sum, p) => sum + p.paretoFrontierSize, 0) / count)),
        solutionQualityScore: Math.round((pts.reduce((sum, p) => sum + p.solutionQualityScore, 0) / count) * 100) / 100,
        runtimeMs: Math.round((pts.reduce((sum, p) => sum + p.runtimeMs, 0) / count) * 10) / 10,
        bestDistanceKm: Math.round(pts.reduce((sum, p) => sum + p.bestDistanceKm, 0) / count),
        bestTravelTimeMin: Math.round(pts.reduce((sum, p) => sum + p.bestTravelTimeMin, 0) / count),
      };
    });

    const baseline = aggregatedResults[0];
    const maxK = aggregatedResults[aggregatedResults.length - 1];
    const expansionRatio = Math.round((maxK.paretoFrontierSize / Math.max(1, baseline.paretoFrontierSize)) * 10) / 10;
    const runtimeScaling = Math.round((maxK.runtimeMs / Math.max(0.1, baseline.runtimeMs)) * 10) / 10;

    // Dynamically calculate optimalK and diminishingReturnsThreshold from marginal improvement & saturation
    let optimalK = kValues[0];
    let maxMarginalEfficiency = -1;
    let diminishingReturnsThreshold = kValues[kValues.length - 1];
    let foundDiminishing = false;

    for (let i = 1; i < aggregatedResults.length; i++) {
      const prev = aggregatedResults[i - 1];
      const curr = aggregatedResults[i];

      // Measure marginal gain: combination of quality score reduction and Pareto frontier expansion
      const qualityDelta = Math.max(0, prev.solutionQualityScore - curr.solutionQualityScore);
      const qualityGainRatio = prev.solutionQualityScore > 0 ? qualityDelta / prev.solutionQualityScore : 0;
      const frontierDelta = Math.max(0, curr.paretoFrontierSize - prev.paretoFrontierSize);
      const frontierGainRatio = prev.paretoFrontierSize > 0 ? frontierDelta / prev.paretoFrontierSize : 0;

      const compositeGain = qualityGainRatio * 0.7 + frontierGainRatio * 0.3;
      const runtimeDelta = Math.max(0.1, curr.runtimeMs - prev.runtimeMs);
      const marginalEfficiency = compositeGain / runtimeDelta;

      if (marginalEfficiency > maxMarginalEfficiency) {
        maxMarginalEfficiency = marginalEfficiency;
        optimalK = curr.K;
      }

      // Diminishing returns threshold: first K where marginal quality improvement drops below 1%
      if (!foundDiminishing && qualityGainRatio < 0.01 && i >= 2) {
        diminishingReturnsThreshold = curr.K;
        foundDiminishing = true;
      }
    }

    return {
      timestamp: new Date().toISOString(),
      evaluatedKValues: kValues,
      results: aggregatedResults,
      insights: {
        optimalK, // Experimentally determined via maximum marginal efficiency (gain / ms)
        diminishingReturnsThreshold, // Experimentally determined point of marginal saturation (<1% delta)
        paretoExpansionRatio: expansionRatio,
        runtimeScalingFactor: runtimeScaling,
      },
    };
  }
}
