import { Graph } from "../graph/graph";
import { GraphEdge } from "../graph/types";
import { PathfindingOptions, PathResult } from "./types";

/**
 * Breadth-First Search (BFS)
 * Computes shortest path by number of hops / transfers.
 * Ideal for unweighted graphs or minimizing transfer count.
 */
export function bfs(
  graph: Graph,
  source: string,
  target: string,
  options: PathfindingOptions = {}
): PathResult {
  const startTime = performance.now();
  let nodesExplored = 0;
  let edgesEvaluated = 0;

  const avoidBlocked = options.avoidBlocked ?? true;

  if (!graph.hasNode(source) || !graph.hasNode(target)) {
    return createEmptyResult("BFS", source, target, startTime, nodesExplored, edgesEvaluated, "Source or target node not found");
  }

  if (source === target) {
    return createSingleNodeResult("BFS", source, startTime);
  }

  const queue: string[] = [source];
  const visited = new Set<string>([source]);
  const parentEdge = new Map<string, { prevNode: string; edge: GraphEdge }>();

  let found = false;

  while (queue.length > 0) {
    const current = queue.shift()!;
    nodesExplored++;

    if (current === target) {
      found = true;
      break;
    }

    const neighbors = graph.getNeighbors(current);
    for (const { node: neighbor, edge } of neighbors) {
      edgesEvaluated++;

      if (avoidBlocked && edge.status === "BLOCKED") continue;
      if (options.requiredCapacityKg && edge.capacityKg < options.requiredCapacityKg) continue;

      if (!visited.has(neighbor.id)) {
        visited.add(neighbor.id);
        parentEdge.set(neighbor.id, { prevNode: current, edge });
        queue.push(neighbor.id);
      }
    }
  }

  const execTime = performance.now() - startTime;

  if (!found) {
    return createEmptyResult("BFS", source, target, startTime, nodesExplored, edgesEvaluated, "No feasible path found via BFS");
  }

  // Reconstruct path
  return reconstructPath("BFS", source, target, parentEdge, execTime, nodesExplored, edgesEvaluated);
}

export function reconstructPath(
  algorithm: string,
  source: string,
  target: string,
  parentMap: Map<string, { prevNode: string; edge: GraphEdge }>,
  execTime: number,
  nodesExplored: number,
  edgesEvaluated: number
): PathResult {
  const path: string[] = [target];
  const edges: GraphEdge[] = [];
  let curr = target;

  while (curr !== source) {
    const parentInfo = parentMap.get(curr);
    if (!parentInfo) break;
    edges.unshift(parentInfo.edge);
    curr = parentInfo.prevNode;
    path.unshift(curr);
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
      algorithm,
      executionTimeMs: Math.round(execTime * 100) / 100,
      nodesExplored,
      edgesEvaluated,
    },
    feasible: true,
  };
}

export function createEmptyResult(
  algorithm: string,
  source: string,
  target: string,
  startTime: number,
  nodesExplored: number,
  edgesEvaluated: number,
  reason: string
): PathResult {
  return {
    source,
    target,
    path: [],
    edges: [],
    totalDistanceKm: 0,
    totalTravelTimeMin: 0,
    totalRiskScore: 0,
    totalCost: 0,
    metrics: {
      algorithm,
      executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      nodesExplored,
      edgesEvaluated,
    },
    feasible: false,
    rejectionReason: reason,
  };
}

export function createSingleNodeResult(algorithm: string, node: string, startTime: number): PathResult {
  return {
    source: node,
    target: node,
    path: [node],
    edges: [],
    totalDistanceKm: 0,
    totalTravelTimeMin: 0,
    totalRiskScore: 0,
    totalCost: 0,
    metrics: {
      algorithm,
      executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      nodesExplored: 1,
      edgesEvaluated: 0,
    },
    feasible: true,
  };
}
