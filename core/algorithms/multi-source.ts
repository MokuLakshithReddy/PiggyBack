import { Graph } from "../graph/graph";
import { GraphEdge } from "../graph/types";
import { MinPriorityQueue } from "../graph/priority-queue";
import { PathfindingOptions, PathResult, WeightFunction } from "./types";
import { createEmptyResult, reconstructPath } from "./bfs";

export interface MultiSourceCandidate {
  sourceId: string;
  initialOffsetCost?: number; // e.g. dispatch delay or fixed vehicle cost
}

/**
 * Multi-Source Dijkstra Search
 * Simultaneously evaluates multiple starting locations (e.g., active trucks or available depots)
 * to reach a target node with the lowest global composite cost.
 */
export function multiSourceDijkstra(
  graph: Graph,
  sources: (string | MultiSourceCandidate)[],
  target: string,
  options: PathfindingOptions = {}
): PathResult {
  const startTime = performance.now();
  let nodesExplored = 0;
  let edgesEvaluated = 0;

  const avoidBlocked = options.avoidBlocked ?? true;
  const weightFn: WeightFunction = options.weightFn ?? ((e: GraphEdge) => e.distanceKm);

  if (!graph.hasNode(target)) {
    return createEmptyResult("MultiSource-Dijkstra", "MULTIPLE", target, startTime, nodesExplored, edgesEvaluated, "Target node not found");
  }

  const distances = new Map<string, number>();
  const parentEdge = new Map<string, { prevNode: string; edge: GraphEdge }>();
  const pq = new MinPriorityQueue<string>();
  const rootSourceMap = new Map<string, string>(); // tracks which source reached this node

  for (const src of sources) {
    const srcId = typeof src === "string" ? src : src.sourceId;
    const offset = typeof src === "string" ? 0 : (src.initialOffsetCost ?? 0);

    if (graph.hasNode(srcId)) {
      distances.set(srcId, offset);
      pq.enqueue(srcId, offset);
      rootSourceMap.set(srcId, srcId);
    }
  }

  if (pq.isEmpty()) {
    return createEmptyResult("MultiSource-Dijkstra", "MULTIPLE", target, startTime, nodesExplored, edgesEvaluated, "None of the source nodes exist in the graph");
  }

  let targetReached = false;

  while (!pq.isEmpty()) {
    const current = pq.dequeue()!;
    nodesExplored++;

    if (current === target) {
      targetReached = true;
      break;
    }

    const currentDist = distances.get(current)!;
    const originSource = rootSourceMap.get(current)!;

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
        rootSourceMap.set(neighbor.id, originSource);
        pq.enqueue(neighbor.id, newDist);
      }
    }
  }

  const execTime = performance.now() - startTime;

  if (!targetReached) {
    return createEmptyResult("MultiSource-Dijkstra", "MULTIPLE", target, startTime, nodesExplored, edgesEvaluated, "Target could not be reached from any source");
  }

  const chosenSource = rootSourceMap.get(target) || "UNKNOWN";
  const result = reconstructPath("MultiSource-Dijkstra", chosenSource, target, parentEdge, execTime, nodesExplored, edgesEvaluated);
  return result;
}
