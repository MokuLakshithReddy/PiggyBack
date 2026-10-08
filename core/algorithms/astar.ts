import { Graph } from "../graph/graph";
import { GraphEdge } from "../graph/types";
import { MinPriorityQueue } from "../graph/priority-queue";
import { PathfindingOptions, PathResult, WeightFunction } from "./types";
import { createEmptyResult, createSingleNodeResult, reconstructPath } from "./bfs";

export interface AStarOptions extends PathfindingOptions {
  heuristic?: (currentNodeId: string, targetNodeId: string) => number;
  averageSpeedKmH?: number; // for time-based heuristic
}

/**
 * Spatial A* Search Algorithm
 * Uses Haversine geographical distance as an admissible and consistent heuristic.
 */
export function aStar(
  graph: Graph,
  source: string,
  target: string,
  options: AStarOptions = {}
): PathResult {
  const startTime = performance.now();
  let nodesExplored = 0;
  let edgesEvaluated = 0;

  const avoidBlocked = options.avoidBlocked ?? true;
  const weightFn: WeightFunction = options.weightFn ?? ((e: GraphEdge) => e.distanceKm);

  const targetNode = graph.getNode(target);
  if (!graph.hasNode(source) || !targetNode) {
    return createEmptyResult("A*", source, target, startTime, nodesExplored, edgesEvaluated, "Source or target node not found");
  }

  if (source === target) {
    return createSingleNodeResult("A*", source, startTime);
  }

  // Default heuristic: Haversine distance
  const heuristicFn = options.heuristic ?? ((currId: string, tgtId: string) => {
    const c1 = graph.getNode(currId)?.coords;
    const c2 = graph.getNode(tgtId)?.coords;
    if (!c1 || !c2) return 0;
    return Graph.haversineDistanceKm(c1, c2);
  });

  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const parentEdge = new Map<string, { prevNode: string; edge: GraphEdge }>();
  const openSet = new MinPriorityQueue<string>();

  gScore.set(source, 0);
  const initialH = heuristicFn(source, target);
  fScore.set(source, initialH);
  openSet.enqueue(source, initialH);

  let targetReached = false;

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue()!;
    nodesExplored++;

    if (current === target) {
      targetReached = true;
      break;
    }

    const currentG = gScore.get(current)!;

    for (const { node: neighbor, edge } of graph.getNeighbors(current)) {
      edgesEvaluated++;

      if (avoidBlocked && edge.status === "BLOCKED") continue;
      if (options.requiredCapacityKg && edge.capacityKg < options.requiredCapacityKg) continue;
      if (options.maxRiskThreshold !== undefined && edge.riskScore > options.maxRiskThreshold) continue;

      const edgeCost = Math.max(0, weightFn(edge));
      const tentativeG = currentG + edgeCost;
      const prevG = gScore.get(neighbor.id) ?? Infinity;

      if (tentativeG < prevG) {
        parentEdge.set(neighbor.id, { prevNode: current, edge });
        gScore.set(neighbor.id, tentativeG);
        const h = heuristicFn(neighbor.id, target);
        const f = tentativeG + h;
        fScore.set(neighbor.id, f);
        openSet.enqueue(neighbor.id, f);
      }
    }
  }

  const execTime = performance.now() - startTime;

  if (!targetReached) {
    return createEmptyResult("A*", source, target, startTime, nodesExplored, edgesEvaluated, "No reachable path found via A*");
  }

  return reconstructPath("A*", source, target, parentEdge, execTime, nodesExplored, edgesEvaluated);
}
