import { Graph } from "../graph/graph";
import { GraphEdge } from "../graph/types";
import { PathfindingOptions, PathResult } from "./types";
import { createEmptyResult, createSingleNodeResult } from "./bfs";

/**
 * Greedy Best-First Search (Baseline)
 * Makes locally optimal choices at each hop towards the target.
 * Extremely fast but not guaranteed to find the globally optimal route.
 */
export function greedySearch(
  graph: Graph,
  source: string,
  target: string,
  options: PathfindingOptions = {}
): PathResult {
  const startTime = performance.now();
  let nodesExplored = 0;
  let edgesEvaluated = 0;

  const avoidBlocked = options.avoidBlocked ?? true;
  const targetNode = graph.getNode(target);

  if (!graph.hasNode(source) || !targetNode) {
    return createEmptyResult("Greedy", source, target, startTime, nodesExplored, edgesEvaluated, "Source or target node not found");
  }

  if (source === target) {
    return createSingleNodeResult("Greedy", source, startTime);
  }

  const visited = new Set<string>([source]);
  const path: string[] = [source];
  const edges: GraphEdge[] = [];
  let current = source;

  let targetReached = false;

  while (current !== target) {
    nodesExplored++;
    const neighbors = graph.getNeighbors(current);

    let bestNeighbor: { nodeId: string; edge: GraphEdge; score: number } | null = null;

    for (const { node: neighbor, edge } of neighbors) {
      edgesEvaluated++;

      if (avoidBlocked && edge.status === "BLOCKED") continue;
      if (options.requiredCapacityKg && edge.capacityKg < options.requiredCapacityKg) continue;
      if (options.maxRiskThreshold !== undefined && edge.riskScore > options.maxRiskThreshold) continue;
      if (visited.has(neighbor.id)) continue;

      // Score by spatial distance to target
      const score = Graph.haversineDistanceKm(neighbor.coords, targetNode.coords);

      if (!bestNeighbor || score < bestNeighbor.score) {
        bestNeighbor = { nodeId: neighbor.id, edge, score };
      }
    }

    if (!bestNeighbor) {
      // Dead end encountered
      break;
    }

    visited.add(bestNeighbor.nodeId);
    path.push(bestNeighbor.nodeId);
    edges.push(bestNeighbor.edge);
    current = bestNeighbor.nodeId;

    if (current === target) {
      targetReached = true;
      break;
    }
  }

  const execTime = performance.now() - startTime;

  if (!targetReached) {
    return createEmptyResult("Greedy", source, target, startTime, nodesExplored, edgesEvaluated, "Greedy trapped in local minimum or dead end");
  }

  const totalDistanceKm = edges.reduce((acc, e) => acc + e.distanceKm, 0);
  const totalTravelTimeMin = edges.reduce((acc, e) => acc + e.travelTimeMin, 0);
  const totalRiskScore = edges.reduce((acc, e) => acc + e.riskScore, 0) / (edges.length || 1);
  const totalCost = edges.reduce((acc, e) => acc + e.cost, 0);

  return {
    source,
    target,
    path,
    edges,
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    totalTravelTimeMin: Math.round(totalTravelTimeMin * 100) / 100,
    totalRiskScore: Math.round(totalRiskScore * 1000) / 1000,
    totalCost: Math.round(totalCost * 100) / 100,
    metrics: {
      algorithm: "Greedy",
      executionTimeMs: Math.round(execTime * 100) / 100,
      nodesExplored,
      edgesEvaluated,
    },
    feasible: true,
  };
}
