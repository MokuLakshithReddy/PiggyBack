import { Graph } from "./graph";
import { GraphEdge, GraphNode } from "./types";

export interface SyntheticGraphConfig {
  numNodes: number;
  averageDegree?: number;
  areaWidthKm?: number;
  areaHeightKm?: number;
  minCapacityKg?: number;
  maxCapacityKg?: number;
  blockedRate?: number;
  congestedRate?: number;
  seed?: number;
}

/**
 * High-speed Synthetic Spatial Graph Generator
 * Creates realistic 2D geometric random / k-nearest graphs for algorithmic scalability benchmarks.
 */
export function generateSyntheticGraph(config: SyntheticGraphConfig): Graph {
  const {
    numNodes,
    averageDegree = 4,
    areaWidthKm = 2000,
    areaHeightKm = 2000,
    minCapacityKg = 2000,
    maxCapacityKg = 15000,
    blockedRate = 0.05,
    congestedRate = 0.10,
  } = config;

  const graph = new Graph();
  const nodes: GraphNode[] = [];

  // Simple pseudo-random generator
  let state = config.seed ?? 42;
  function pseudoRandom(): number {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  }

  // Generate nodes uniformly or in clustered spatial regions
  for (let i = 0; i < numNodes; i++) {
    const lat = 10 + (pseudoRandom() * (areaHeightKm / 111));
    const lng = 70 + (pseudoRandom() * (areaWidthKm / 111));

    const node: GraphNode = {
      id: `NODE-${i}`,
      name: `Waypoint-${i}`,
      coords: { lat, lng },
      type: i % 10 === 0 ? "HUB" : "WAYPOINT",
      capacity: 50000,
    };
    nodes.push(node);
    graph.addNode(node);
  }

  let edgeId = 1;

  // Grid/spatial bucket indexing for fast nearest-neighbor edge creation O(N)
  const cellSizeKm = 100;
  const grid = new Map<string, number[]>();

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const cellX = Math.floor((n.coords.lng * 111) / cellSizeKm);
    const cellY = Math.floor((n.coords.lat * 111) / cellSizeKm);
    const cellKey = `${cellX}:${cellY}`;

    if (!grid.has(cellKey)) grid.set(cellKey, []);
    grid.get(cellKey)!.push(i);
  }

  // Connect each node to closest neighbors
  const edgesAdded = new Set<string>();

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const cellX = Math.floor((n.coords.lng * 111) / cellSizeKm);
    const cellY = Math.floor((n.coords.lat * 111) / cellSizeKm);

    // Search 3x3 surrounding cells
    const candidateIndices: number[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx}:${cellY + dy}`;
        const inCell = grid.get(key);
        if (inCell) candidateIndices.push(...inCell);
      }
    }

    // Sort by distance and pick top K
    const distances = candidateIndices
      .filter((idx) => idx !== i)
      .map((idx) => ({
        idx,
        dist: Graph.haversineDistanceKm(n.coords, nodes[idx].coords),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, averageDegree);

    for (const neighbor of distances) {
      const u = n.id;
      const v = nodes[neighbor.idx].id;
      const key = u < v ? `${u}--${v}` : `${v}--${u}`;

      if (!edgesAdded.has(key)) {
        edgesAdded.add(key);

        const distKm = Math.max(5, Math.round(neighbor.dist));
        const travelTimeMin = Math.round((distKm / 65) * 60); // 65 km/h avg speed
        const rand = pseudoRandom();
        const status =
          rand < blockedRate ? "BLOCKED" : rand < blockedRate + congestedRate ? "CONGESTED" : "ACTIVE";
        const risk = Math.round((0.05 + pseudoRandom() * 0.40) * 1000) / 1000;
        const cap = Math.round(minCapacityKg + pseudoRandom() * (maxCapacityKg - minCapacityKg));

        const edge: GraphEdge = {
          id: `SYN-EDGE-${edgeId++}`,
          source: u,
          target: v,
          distanceKm: distKm,
          travelTimeMin,
          riskScore: risk,
          capacityKg: cap,
          currentLoadKg: Math.round(cap * 0.2),
          cost: Math.round(distKm * 2.5),
          status,
          bidirectional: true,
        };

        graph.addEdge(edge);
      }
    }
  }

  return graph;
}
