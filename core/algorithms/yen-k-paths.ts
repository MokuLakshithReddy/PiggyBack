import { Graph } from "../graph/graph";
import { GraphEdge } from "../graph/types";
import { PathfindingOptions, PathResult, WeightFunction } from "./types";
import { dijkstra } from "./dijkstra";

/**
 * Yen's K-Shortest Loopless Paths Algorithm
 * Computes up to K distinct shortest loopless paths between source and target.
 * Standard deviation-based spur path search guaranteeing looplessness and optimality.
 */
export function yenKShortestPaths(
  graph: Graph,
  source: string,
  target: string,
  K: number,
  options: PathfindingOptions = {}
): PathResult[] {
  const startTime = performance.now();
  const weightFn: WeightFunction = options.weightFn ?? ((e: GraphEdge) => e.distanceKm);

  // A stores the K shortest paths
  const A: PathResult[] = [];
  // B stores candidate paths indexed by unique path string
  const B = new Map<string, PathResult>();

  // Determine the 1st shortest path using Dijkstra
  const firstPath = dijkstra(graph, source, target, options);
  if (!firstPath.feasible || firstPath.path.length === 0) {
    return [];
  }

  A.push(firstPath);

  // Iterate to find the remaining K - 1 paths
  for (let k = 1; k < K; k++) {
    const prevPath = A[k - 1];

    // The spur node ranges from the first node up to the second-to-last node in the previous path
    for (let i = 0; i < prevPath.path.length - 1; i++) {
      const spurNode = prevPath.path[i];
      const rootPathNodes = prevPath.path.slice(0, i + 1);
      const rootPathEdges = prevPath.edges.slice(0, i);

      // Clone graph to isolate edge and node deletions
      const tempGraph = graph.clone();

      // 1. Remove edges that share the same root path in any previously accepted path in A
      for (const p of A) {
        if (p.path.length > i && rootPathNodes.every((n, idx) => p.path[idx] === n)) {
          const u = p.path[i];
          const v = p.path[i + 1];
          const edgeToRemove = tempGraph.getEdgeBetween(u, v);
          if (edgeToRemove) {
            tempGraph.setEdgeStatus(edgeToRemove.id, "BLOCKED");
          }
        }
      }

      // 2. Remove all nodes in rootPath except spurNode to prevent loops
      for (const node of rootPathNodes) {
        if (node !== spurNode) {
          for (const neighbor of tempGraph.getNeighbors(node)) {
            tempGraph.setEdgeStatus(neighbor.edge.id, "BLOCKED");
          }
        }
      }

      // 3. Calculate spur path from spurNode to target
      const spurPath = dijkstra(tempGraph, spurNode, target, options);

      if (spurPath.feasible && spurPath.path.length > 0) {
        // Concatenate root path and spur path
        const totalNodes = [...rootPathNodes.slice(0, -1), ...spurPath.path];
        const totalEdges = [...rootPathEdges, ...spurPath.edges];

        let totalDistanceKm = 0;
        let totalTravelTimeMin = 0;
        let totalRiskScore = 0;
        let totalCost = 0;

        for (const e of totalEdges) {
          totalDistanceKm += e.distanceKm;
          totalTravelTimeMin += e.travelTimeMin;
          totalRiskScore += e.riskScore;
          totalCost += e.cost;
        }

        const candidateKey = totalNodes.join("->");
        if (!A.some((p) => p.path.join("->") === candidateKey) && !B.has(candidateKey)) {
          const candidateResult: PathResult = {
            source,
            target,
            path: totalNodes,
            edges: totalEdges,
            totalDistanceKm,
            totalTravelTimeMin,
            totalRiskScore: totalEdges.length > 0 ? totalRiskScore / totalEdges.length : 0,
            totalCost,
            feasible: true,
            metrics: {
              algorithm: "Yen-KSP",
              executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
              nodesExplored: spurPath.metrics.nodesExplored,
              edgesEvaluated: spurPath.metrics.edgesEvaluated,
            },
          };
          B.set(candidateKey, candidateResult);
        }
      }
    }

    if (B.size === 0) {
      break;
    }

    // Select lowest-cost candidate from B
    let bestKey: string | null = null;
    let bestScore = Infinity;

    for (const [key, cand] of B.entries()) {
      let score = 0;
      for (const e of cand.edges) {
        score += weightFn(e);
      }
      if (score < bestScore) {
        bestScore = score;
        bestKey = key;
      }
    }

    if (bestKey && B.has(bestKey)) {
      A.push(B.get(bestKey)!);
      B.delete(bestKey);
    }
  }

  return A;
}
