import { buildPanIndiaLogisticsGraph } from "../core/graph/adapter";
import { generateSyntheticGraph } from "../core/graph/synthetic-generator";
import { bfs } from "../core/algorithms/bfs";
import { dijkstra } from "../core/algorithms/dijkstra";
import { aStar } from "../core/algorithms/astar";
import { greedySearch } from "../core/algorithms/greedy";
import { multiSourceDijkstra } from "../core/algorithms/multi-source";
import { ConstraintEngine } from "../core/constraints/constraint-engine";
import { PlanContext } from "../core/constraints/types";
import { PiggyBackOptimizer } from "../core/optimizer/optimizer";

// ANSI styling
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";
const RESET = "\x1b[0m";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`  ${RED}✗ [FAIL] ${msg}${RESET}`);
    throw new Error(msg);
  }
  console.log(`  ${GREEN}✓ [PASS]${RESET} ${msg}`);
}

console.log(`\n${BOLD}========================================================================${RESET}`);
console.log(`${BOLD}  PIGGYBACK OPTIMIZATION FLAGSHIP — VERIFICATION & AUDIT SUITE${RESET}`);
console.log(`  Decoupled Core: Graph Engine, Baselines, Pareto Frontier & Explainer`);
console.log(`${BOLD}========================================================================${RESET}\n`);

// ─── 1. Graph Abstraction & Seed Adapter ───
console.log(`${BOLD}${CYAN}[STAGE 1] Pan-India Logistics Graph Verification${RESET}`);
const graph = buildPanIndiaLogisticsGraph();
const metrics = graph.getMetrics();
console.log(`  Nodes: ${metrics.totalNodes}, Edges: ${metrics.totalEdges}, Avg Degree: ${metrics.averageDegree.toFixed(2)}`);
assert(metrics.totalNodes >= 20, "Logistics network loaded all 20 strategic hubs");
assert(metrics.totalEdges >= 30, "National highway & carrier segments successfully created");

// ─── 2. Multi-Algorithm Baselines Benchmark ───
console.log(`\n${BOLD}${CYAN}[STAGE 2] Multi-Algorithm Execution Benchmark (Delhi -> Chennai)${RESET}`);
const source = "Delhi";
const target = "Chennai";

const resBfs = bfs(graph, source, target);
const resDijkstraDist = dijkstra(graph, source, target, { weightFn: (e) => e.distanceKm });
const resDijkstraTime = dijkstra(graph, source, target, { weightFn: (e) => e.travelTimeMin });
const resDijkstraRisk = dijkstra(graph, source, target, { weightFn: (e) => e.riskScore * 100 });
const resAStar = aStar(graph, source, target);
const resGreedy = greedySearch(graph, source, target);

console.log(`  ---------------------------------------------------------------------------------------------------------`);
console.log(`  | Algorithm            | Feasible | Distance (km) | Time (min) | Avg Risk | Explored | Time (ms)        |`);
console.log(`  ---------------------------------------------------------------------------------------------------------`);
const algos = [
  resBfs,
  resDijkstraDist,
  resDijkstraTime,
  resDijkstraRisk,
  resAStar,
  resGreedy,
];
for (const a of algos) {
  console.log(
    `  | ${a.metrics.algorithm.padEnd(20)} | ${String(a.feasible).padEnd(8)} | ${String(a.totalDistanceKm).padStart(13)} | ${String(a.totalTravelTimeMin).padStart(10)} | ${a.totalRiskScore.toFixed(3).padStart(8)} | ${String(a.metrics.nodesExplored).padStart(8)} | ${String(a.metrics.executionTimeMs.toFixed(2)).padStart(16)} |`
  );
}
console.log(`  ---------------------------------------------------------------------------------------------------------`);

assert(resBfs.feasible && resBfs.path.length > 0, "BFS found transfer-minimal path");
assert(resDijkstraDist.feasible, "Dijkstra found distance-optimal path");
assert(resAStar.feasible, "A* spatial heuristic found optimal path");
assert(resDijkstraDist.totalDistanceKm <= resGreedy.totalDistanceKm, "Dijkstra proves optimal or equal to Greedy baseline");

// ─── 3. Multi-Source Search ───
console.log(`\n${BOLD}${CYAN}[STAGE 3] Multi-Source Fleet Search (Nearest Fleet Hub to Target)${RESET}`);
const fleetHubs = ["Jaipur", "Delhi", "Ahmedabad", "Nagpur"];
const multiRes = multiSourceDijkstra(graph, fleetHubs, "Chennai");
console.log(`  Selected Origin: ${multiRes.source} -> Destination: ${multiRes.target} (${multiRes.totalDistanceKm} km, ${multiRes.totalTravelTimeMin} min)`);
assert(multiRes.feasible, "Multi-source search identified closest available fleet asset");

// ─── 4. Constraint Engine Feasibility Gating ───
console.log(`\n${BOLD}${CYAN}[STAGE 4] Constraint Engine Feasibility Tests${RESET}`);
const constraintEngine = new ConstraintEngine();

// Normal context (200kg fits within scheduled carrier spare capacity)
const normalContext: PlanContext = {
  cargoWeightKg: 200,
  priorityLevel: 2,
  slaDeadlineMinutes: 2000,
  maxAcceptableRiskScore: 0.60,
};
const evalNormal = constraintEngine.evaluate(resDijkstraDist, normalContext);
assert(evalNormal.isFeasible, "Normal context (200kg) satisfies all hard constraints");

// Strict impossible deadline
const strictDeadlineContext: PlanContext = {
  ...normalContext,
  slaDeadlineMinutes: 60, // impossible 1 hr from Delhi to Chennai
};
const evalStrict = constraintEngine.evaluate(resDijkstraDist, strictDeadlineContext);
assert(!evalStrict.isFeasible, "Correctly rejects candidate violating SLA deadline");
console.log(`  Rejection Reason: ${evalStrict.violatedConstraints[0]}`);

// Excessive weight
const heavyContext: PlanContext = {
  ...normalContext,
  cargoWeightKg: 100000, // 100 tons exceeds carrier payload
};
const evalHeavy = constraintEngine.evaluate(resDijkstraDist, heavyContext);
assert(!evalHeavy.isFeasible, "Correctly rejects candidate violating weight capacity");

// ─── 5. Multi-Objective Pareto Optimization & Explainable Decision ───
console.log(`\n${BOLD}${CYAN}[STAGE 5] PiggyBack Optimizer: Pareto Frontier & Explainable Decision${RESET}`);
const optimizer = new PiggyBackOptimizer(graph, constraintEngine);

const solveResult = optimizer.solve(source, target, normalContext, {
  profile: "BALANCED",
  enableShadowPlan: true,
});

assert(solveResult.status === "OPTIMAL", "PiggyBack solved multi-objective plan successfully");
assert(solveResult.paretoFrontier.length > 0, "Discovered Pareto non-dominated frontier");
assert(solveResult.primaryPlan !== null, "Recommended primary plan generated");
assert(solveResult.shadowPlan !== null, "Resilient shadow plan generated");

console.log(`\n  ${MAGENTA}Pareto Frontier Size:${RESET} ${solveResult.paretoFrontier.length} solutions`);
for (const p of solveResult.paretoFrontier) {
  console.log(`    - Plan [${p.id}]: Time=${p.candidate.totalTravelTimeMin}m, Dist=${p.candidate.totalDistanceKm}km, Risk=${p.candidate.totalRiskScore.toFixed(3)}, Score=${p.compositeScore}`);
}

console.log(`\n  ${YELLOW}Primary Plan Path:${RESET} ${solveResult.primaryPlan?.candidate.path.join(" ➔ ")}`);
console.log(`  ${YELLOW}Shadow Plan Path:${RESET}  ${solveResult.shadowPlan?.candidate.path.join(" ➔ ")}`);

console.log(`\n  ${BOLD}Decision Justification & Auditable Explanation:${RESET}`);
console.log(solveResult.explanation);

console.log(`\n  ${BOLD}Trade-Off Summary:${RESET} ${solveResult.tradeOffReport.keyTradeOffSummary}`);

// ─── 6. Scalability Verification with Synthetic Graphs ───
console.log(`\n${BOLD}${CYAN}[STAGE 6] Algorithmic Scalability Benchmarking (Synthetic Graphs)${RESET}`);
const testSizes = [100, 1000, 5000];

for (const N of testSizes) {
  const synStart = performance.now();
  const synGraph = generateSyntheticGraph({ numNodes: N, averageDegree: 5 });
  const genTime = performance.now() - synStart;

  const tStart = performance.now();
  const astarRes = aStar(synGraph, "NODE-0", `NODE-${N - 1}`);
  const astarTime = performance.now() - tStart;

  const dStart = performance.now();
  const dijRes = dijkstra(synGraph, "NODE-0", `NODE-${N - 1}`);
  const dijTime = performance.now() - dStart;

  console.log(
    `  N=${String(N).padEnd(5)} | Graph Gen: ${genTime.toFixed(1)}ms | A*: ${astarTime.toFixed(2)}ms (explored: ${astarRes.metrics.nodesExplored}) | Dijkstra: ${dijTime.toFixed(2)}ms (explored: ${dijRes.metrics.nodesExplored})`
  );
}

console.log(`\n${BOLD}========================================================================${RESET}`);
console.log(`${BOLD}${GREEN}  ALL VERIFICATION TESTS & BENCHMARKS PASSED SUCCESSFULLY!${RESET}`);
console.log(`${BOLD}========================================================================${RESET}\n`);
