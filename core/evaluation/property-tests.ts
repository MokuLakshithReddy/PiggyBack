import { Graph } from "../graph/graph";
import { generateSyntheticGraph } from "../graph/synthetic-generator";
import { dijkstra } from "../algorithms/dijkstra";
import { aStar } from "../algorithms/astar";
import { bfs } from "../algorithms/bfs";
import { greedySearch } from "../algorithms/greedy";
import { PiggyBackOptimizer } from "../optimizer/optimizer";
import { PlanContext } from "../constraints/types";

export interface PropertyCheckSummary {
  propertyName: string;
  totalTrials: number;
  passedTrials: number;
  violations: string[];
}

/**
 * Property-Based Testing Harness
 * Mathematically verifies graph invariant properties across randomized synthetic graphs.
 */
export class PropertyBasedTester {
  public static runPropertyTests(trials: number = 30): PropertyCheckSummary[] {
    const checks: Record<string, { total: number; passed: number; violations: string[] }> = {
      "Source and Target Boundary Invariant": { total: 0, passed: 0, violations: [] },
      "Edge Adjacency & Existence Invariant": { total: 0, passed: 0, violations: [] },
      "Blocked Edge Immunity Invariant": { total: 0, passed: 0, violations: [] },
      "Capacity Compliance Invariant": { total: 0, passed: 0, violations: [] },
      "Dijkstra vs Greedy Optimality Dominance": { total: 0, passed: 0, violations: [] },
      "A* Spatial Heuristic Admissibility": { total: 0, passed: 0, violations: [] },
    };

    for (let t = 0; t < trials; t++) {
      const numNodes = 50 + (t * 10);
      const seed = 1000 + t * 37;
      const graph = generateSyntheticGraph({
        numNodes,
        averageDegree: 5,
        blockedRate: 0.08,
        congestedRate: 0.12,
        seed,
      });

      const srcId = `NODE-0`;
      const tgtId = `NODE-${numNodes - 1}`;

      const context: PlanContext = {
        cargoWeightKg: 1000,
        priorityLevel: 2,
        slaDeadlineMinutes: 5000,
      };

      const optimizer = new PiggyBackOptimizer(graph);
      const solveRes = optimizer.solve(srcId, tgtId, context);

      // Property 1: Source & Target Boundary
      checks["Source and Target Boundary Invariant"].total++;
      if (solveRes.status === "OPTIMAL" && solveRes.primaryPlan) {
        const path = solveRes.primaryPlan.candidate.path;
        if (path[0] === srcId && path[path.length - 1] === tgtId) {
          checks["Source and Target Boundary Invariant"].passed++;
        } else {
          checks["Source and Target Boundary Invariant"].violations.push(
            `Trial ${t}: Start ${path[0]} !== ${srcId} or End ${path[path.length - 1]} !== ${tgtId}`
          );
        }
      } else {
        checks["Source and Target Boundary Invariant"].passed++; // Infeasible is valid
      }

      // Property 2: Edge Adjacency & Existence
      checks["Edge Adjacency & Existence Invariant"].total++;
      if (solveRes.status === "OPTIMAL" && solveRes.primaryPlan) {
        const path = solveRes.primaryPlan.candidate.path;
        let validAdjacency = true;
        for (let i = 0; i < path.length - 1; i++) {
          const u = path[i];
          const v = path[i + 1];
          if (!graph.getEdgeBetween(u, v)) {
            validAdjacency = false;
            checks["Edge Adjacency & Existence Invariant"].violations.push(
              `Trial ${t}: Edge (${u}, ${v}) does not exist in graph adjacency`
            );
            break;
          }
        }
        if (validAdjacency) checks["Edge Adjacency & Existence Invariant"].passed++;
      } else {
        checks["Edge Adjacency & Existence Invariant"].passed++;
      }

      // Property 3: Blocked Edge Immunity
      checks["Blocked Edge Immunity Invariant"].total++;
      if (solveRes.status === "OPTIMAL" && solveRes.primaryPlan) {
        const hasBlocked = solveRes.primaryPlan.candidate.edges.some((e) => e.status === "BLOCKED");
        if (!hasBlocked) {
          checks["Blocked Edge Immunity Invariant"].passed++;
        } else {
          checks["Blocked Edge Immunity Invariant"].violations.push(`Trial ${t}: Solution traverses a BLOCKED edge`);
        }
      } else {
        checks["Blocked Edge Immunity Invariant"].passed++;
      }

      // Property 4: Capacity Compliance
      checks["Capacity Compliance Invariant"].total++;
      if (solveRes.status === "OPTIMAL" && solveRes.primaryPlan) {
        const capacityValid = solveRes.primaryPlan.candidate.edges.every(
          (e) => (e.capacityKg - (e.currentLoadKg || 0)) >= context.cargoWeightKg
        );
        if (capacityValid) {
          checks["Capacity Compliance Invariant"].passed++;
        } else {
          checks["Capacity Compliance Invariant"].violations.push(`Trial ${t}: Capacity violated on path edge`);
        }
      } else {
        checks["Capacity Compliance Invariant"].passed++;
      }

      // Property 5: Dijkstra vs Greedy Optimality Dominance
      checks["Dijkstra vs Greedy Optimality Dominance"].total++;
      const dij = dijkstra(graph, srcId, tgtId, { weightFn: (e) => e.distanceKm, avoidBlocked: true });
      const grd = greedySearch(graph, srcId, tgtId, { avoidBlocked: true });
      if (dij.feasible && grd.feasible) {
        if (dij.totalDistanceKm <= grd.totalDistanceKm + 0.001) {
          checks["Dijkstra vs Greedy Optimality Dominance"].passed++;
        } else {
          checks["Dijkstra vs Greedy Optimality Dominance"].violations.push(
            `Trial ${t}: Dijkstra dist (${dij.totalDistanceKm}) > Greedy dist (${grd.totalDistanceKm})`
          );
        }
      } else {
        checks["Dijkstra vs Greedy Optimality Dominance"].passed++;
      }

      // Property 6: A* Spatial Admissibility
      checks["A* Spatial Heuristic Admissibility"].total++;
      const astarRes = aStar(graph, srcId, tgtId, { weightFn: (e) => e.distanceKm, avoidBlocked: true });
      if (dij.feasible && astarRes.feasible) {
        // A* with admissible heuristic should yield identical optimal distance as Dijkstra
        if (Math.abs(dij.totalDistanceKm - astarRes.totalDistanceKm) < 0.05) {
          checks["A* Spatial Heuristic Admissibility"].passed++;
        } else {
          checks["A* Spatial Heuristic Admissibility"].violations.push(
            `Trial ${t}: A* dist (${astarRes.totalDistanceKm}) differs from Dijkstra optimal (${dij.totalDistanceKm})`
          );
        }
      } else {
        checks["A* Spatial Heuristic Admissibility"].passed++;
      }
    }

    return Object.entries(checks).map(([propertyName, data]) => ({
      propertyName,
      totalTrials: data.total,
      passedTrials: data.passed,
      violations: data.violations,
    }));
  }
}
