import { Graph } from "../graph/graph";
import { GraphEdge } from "../graph/types";
import { MinPriorityQueue } from "../graph/priority-queue";
import { PathfindingOptions, PathResult, WeightFunction } from "./types";
import { createEmptyResult, createSingleNodeResult, reconstructPath } from "./bfs";

/**
 * Standard / Parameterized Dijkstra's Algorithm
 * Optimal shortest path for non-negative edge weights using a binary min-heap.
 */
export function dijkstra(
  graph: Graph,
  source: string,
  target: string,
  options: PathfindingOptions = {}
): PathResult {
  const startTime = performance.now();
  let nodesExplored = 0;
  let edgesEvaluated = 0;

  const avoidBlocked = options.avoidBlocked ?? true;
  const weightFn: WeightFunction = options.weightFn ?? ((e: GraphEdge) => e.distanceKm);

  if (!graph.hasNode(source) || !graph.hasNode(target)) {
    return createEmptyResult("Dijkstra", source, target, startTime, nodesExplored, edgesEvaluated, "Source or target node not found");
  }

  if (source === target) {
    return createSingleNodeResult("Dijkstra", source, startTime);
  }

  const distances = new Map<string, number>();
  const parentEdge = new Map<string, { prevNode: string; edge: GraphEdge }>();
  const pq = new MinPriorityQueue<string>();

  distances.set(source, 0);
  pq.enqueue(source, 0);

  let targetReached = false;

  while (!pq.isEmpty()) {
    const current = pq.dequeue()!;
    nodesExplored++;

    if (current === target) {
      targetReached = true;
      break;
    }

    const currentDist = distances.get(current)!;

    for (const { node: neighbor, edge } of graph.getNeighbors(current)) {
      edgesEvaluated++;

      if (avoidBlocked && edge.status === "BLOCKED") continue;
      if (options.requiredCapacityKg && edge.capacityKg < options.requiredCapacityKg) continue;
      if (options.maxRiskThreshold !== undefined && edge.riskScore > options.maxRiskThreshold) continue;

      const edgeCost = Math.max(0, weightFn(edge));
      const newDist = currentDist + edgeCost;
      const prevDist = distances.get(neighbor.id) ?? Infinity;

      if (newDist < prevDist) {
        distances.set(neighbor.id, newDist);
        parentEdge.set(neighbor.id, { prevNode: current, edge });
        pq.enqueue(neighbor.id, newDist);
      }
    }
  }

  const execTime = performance.now() - startTime;

  if (!targetReached) {
    return createEmptyResult("Dijkstra", source, target, startTime, nodesExplored, edgesEvaluated, "No reachable path found via Dijkstra");
  }

  return reconstructPath("Dijkstra", source, target, parentEdge, execTime, nodesExplored, edgesEvaluated);
}
