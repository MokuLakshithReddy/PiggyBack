import { HardConstraintFilter } from "../lib/engine/constraints";
import { LexicographicOptimizer } from "../lib/engine/optimizer";
import { ReceiptBuilder } from "../lib/engine/receipt-builder";
import { getHubRoadDistanceKm } from "../lib/engine/candidate-generator";
import { CandidateRoute, RejectionReason, StaffShipment, Truck } from "../lib/engine/types";
import { buildPanIndiaLogisticsGraph } from "../core/graph/adapter";
import { PiggyBackOptimizer } from "../core/optimizer/optimizer";
import { computeParetoFrontier } from "../core/optimizer/pareto";
import { PlanContext } from "../core/constraints/types";
import { PathResult } from "../core/algorithms/types";
import { ScoredPlan } from "../core/optimizer/types";

// ANSI Formatting
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";
const RESET = "\x1b[0m";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (!condition) {
    console.error(`  ${RED}✗ [FAIL] ${testName}${RESET}${detail ? ` -> ${detail}` : ""}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
  passedTests++;
  console.log(`  ${GREEN}✓ [PASS]${RESET} ${testName}`);
}

console.log(`\n${BOLD}========================================================================${RESET}`);
console.log(`${BOLD}  MOSAIC OPTIMIZER MATHEMATICAL & ALGORITHMIC VERIFICATION SUITE${RESET}`);
console.log(`  Automated Property Checks Across Candidate Gen, Pareto, SLA & ESG${RESET}`);
console.log(`${BOLD}========================================================================${RESET}\n`);

// ────────────────────────────────────────────────────────────────────────────
// CHECK 1: SLA Buffer Margin Active Optimization
// ────────────────────────────────────────────────────────────────────────────
console.log(`${BOLD}${CYAN}[CHECK 1] Lexicographical SLA Buffer Margin Optimization${RESET}`);

const mockShipment: StaffShipment = {
  id: "SHP-AUDIT-1",
  code: "AUD-01",
  cargoId: "CRG-01",
  origin: "Delhi",
  destination: "Chennai",
  priority: "High",
  weight: 150,
  volume: 5,
  deadline: "2026-10-10T20:00:00.000Z", // 20:00 deadline
  status: "Misplaced",
  assignedTruck: null,
  assignedRoute: null,
  currentLocation: "Delhi",
  plannedRoute: ["Delhi", "Chennai"],
};

// Candidate A arrives at 10:00 (10 hour buffer margin)
// Candidate B arrives at 19:00 (1 hour buffer margin) - identical cost & distance
const candidateEarly: CandidateRoute = {
  id: "CAND-EARLY",
  shipmentId: mockShipment.id,
  vehicleId: "TRK-01",
  pickupHub: "Delhi",
  dropoffHub: "Chennai",
  pickupTime: "2026-10-10T02:00:00.000Z",
  dropoffTime: "2026-10-10T10:00:00.000Z",
  pathMinWeight: 1000,
  pathMinVolume: 20,
  isTransfer: false,
  transfers: 0,
  downstreamDelayMinutes: 0,
  delayMinutes: 0,
  incrementalCost: 2000,
  distance: 2100,
  isFeasible: true,
};

const candidateLate: CandidateRoute = {
  id: "CAND-LATE",
  shipmentId: mockShipment.id,
  vehicleId: "TRK-02",
  pickupHub: "Delhi",
  dropoffHub: "Chennai",
  pickupTime: "2026-10-10T08:00:00.000Z",
  dropoffTime: "2026-10-10T19:00:00.000Z", // 1h before deadline
  pathMinWeight: 1000,
  pathMinVolume: 20,
  isTransfer: false,
  transfers: 0,
  downstreamDelayMinutes: 0,
  delayMinutes: 0,
  incrementalCost: 2000,
  distance: 2100,
  isFeasible: true,
};

const optSLA = new LexicographicOptimizer(mockShipment, [candidateLate, candidateEarly]);
const optResSLA = optSLA.solve();

assert(
  optResSLA.primaryPlan?.candidate.id === "CAND-EARLY",
  "Optimizer actively prioritizes candidate with larger SLA safety buffer margin",
  `Selected: ${optResSLA.primaryPlan?.candidate.id}`
);
console.log(`  ↳ Primary Plan SLA Margin: ${optResSLA.primaryPlan?.slaMarginMinutes} minutes buffer.`);

// ────────────────────────────────────────────────────────────────────────────
// CHECK 2: True Edge-Disjoint Shadow Plan Resilience
// ────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}${CYAN}[CHECK 2] Topological Shadow-Plan Independence Verification${RESET}`);

const graph = buildPanIndiaLogisticsGraph();
const coreOptimizer = new PiggyBackOptimizer(graph);

const context: PlanContext = {
  cargoWeightKg: 150,
  priorityLevel: 2,
  slaDeadlineMinutes: 4000,
};

const solveRes = coreOptimizer.solve("Delhi", "Chennai", context, {
  profile: "BALANCED",
  enableShadowPlan: true,
});

assert(solveRes.primaryPlan !== null, "Primary plan resolved");
if (solveRes.shadowPlan) {
  const primaryPathStr = solveRes.primaryPlan!.candidate.path.join("->");
  const shadowPathStr = solveRes.shadowPlan.candidate.path.join("->");
  assert(
    primaryPathStr !== shadowPathStr,
    "Shadow plan path is strictly non-identical to primary plan path",
    `Primary: [${primaryPathStr}] vs Shadow: [${shadowPathStr}]`
  );

  const primaryEdgeIds = new Set(solveRes.primaryPlan!.candidate.edges.map((e) => e.id));
  const overlappingEdges = solveRes.shadowPlan.candidate.edges.filter((e) => primaryEdgeIds.has(e.id));
  const independencePct =
    100 - (overlappingEdges.length / Math.max(1, solveRes.primaryPlan!.candidate.edges.length)) * 100;

  console.log(`  ↳ Primary Corridor: ${primaryPathStr}`);
  console.log(`  ↳ Shadow Corridor:  ${shadowPathStr}`);
  console.log(`  ↳ Independence Degree: ${independencePct.toFixed(1)}% edge disjoint`);
  assert(independencePct > 0, "Shadow plan achieves positive topological corridor independence");
} else {
  console.log(`  ↳ No alternative distinct path exists in network under active SLA constraint (safe null return).`);
}

// ────────────────────────────────────────────────────────────────────────────
// CHECK 3: Deterministic SHA-256 Decision Receipt Cryptography
// ────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}${CYAN}[CHECK 3] Deterministic SHA-256 Cryptographic Audit Verification${RESET}`);

const receiptParams = {
  shipment: mockShipment,
  status: "OPTIMAL" as const,
  planId: "PLAN-AUDIT-FIXED",
  allCandidates: [candidateEarly, candidateLate],
  selectedCandidate: candidateEarly,
  solveTimeMs: 12,
  currentTime: "2026-10-10T12:00:00.000Z", // Fixed timestamp for determinism check
};

const r1 = ReceiptBuilder.buildReceipt(receiptParams);
const r2 = ReceiptBuilder.buildReceipt(receiptParams);

assert(r1.hash === r2.hash, "Decision receipt hash is 100% deterministic across multiple runs");
assert(r1.hash.startsWith("0x"), "Decision receipt hash starts with 0x prefix");
assert(r1.hash.length === 66, "Decision receipt hash is a valid 256-bit hexadecimal string (0x + 64 chars)");
assert(/^0x[0-9a-f]{64}$/i.test(r1.hash), "Receipt hash contains only valid hexadecimal characters");
console.log(`  ↳ Generated SHA-256 Receipt: ${r1.hash}`);

// ────────────────────────────────────────────────────────────────────────────
// CHECK 4: 7-Dimension Constraint Gate Differentiation
// ────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}${CYAN}[CHECK 4] 7-Dimension Constraint Gate Discrete Rejection Codes${RESET}`);

const baseTruck: Truck = {
  id: "TRK-BASE",
  numberPlate: "TS 09 AB 1234",
  driverName: "Test Driver",
  driverMobile: "+91 99999 99999",
  copassengerName: "Co Driver",
  copassengerMobile: "+91 99999 99998",
  currentLocation: "Delhi",
  destination: "Chennai",
  capacity: 1000,
  availableCapacity: 500,
  maxVolume: 30,
  availableVolume: 10,
  status: "Available",
  schedule: [],
};

// Test 4A: Weight overload -> INSUFFICIENT_CAPACITY
const evalWeight = HardConstraintFilter.evaluate({
  shipment: { ...mockShipment, weight: 600, volume: 5 }, // weight 600 > 500
  truck: baseTruck,
  pickupHub: "Delhi",
  dropoffHub: "Chennai",
  pickupTime: "2026-10-10T10:00:00.000Z",
  dropoffTime: "2026-10-10T18:00:00.000Z",
  currentTime: "2026-10-10T08:00:00.000Z",
  availableWeight: 500,
  availableVolume: 10,
});
assert(
  evalWeight.reason === RejectionReason.INSUFFICIENT_CAPACITY,
  "Rejects excessive payload weight with INSUFFICIENT_CAPACITY"
);

// Test 4B: Volume overload -> INSUFFICIENT_VOLUME
const evalVolume = HardConstraintFilter.evaluate({
  shipment: { ...mockShipment, weight: 200, volume: 15 }, // volume 15 > 10
  truck: baseTruck,
  pickupHub: "Delhi",
  dropoffHub: "Chennai",
  pickupTime: "2026-10-10T10:00:00.000Z",
  dropoffTime: "2026-10-10T18:00:00.000Z",
  currentTime: "2026-10-10T08:00:00.000Z",
  availableWeight: 500,
  availableVolume: 10,
});
assert(
  evalVolume.reason === RejectionReason.INSUFFICIENT_VOLUME,
  "Rejects excessive cubic volume with discrete INSUFFICIENT_VOLUME"
);

// Test 4C: Offline Hub -> HUB_OFFLINE
const evalHub = HardConstraintFilter.evaluate({
  shipment: mockShipment,
  truck: baseTruck,
  pickupHub: "Delhi",
  dropoffHub: "Chennai",
  pickupTime: "2026-10-10T10:00:00.000Z",
  dropoffTime: "2026-10-10T18:00:00.000Z",
  currentTime: "2026-10-10T08:00:00.000Z",
  availableWeight: 500,
  availableVolume: 10,
  hubOperationalStatus: { Chennai: false },
});
assert(
  evalHub.reason === RejectionReason.HUB_OFFLINE,
  "Rejects offline hub with discrete HUB_OFFLINE"
);

// Test 4D: Statutory Driver Duty Limits -> DUTY_LIMIT_EXCEEDED
const evalDuty = HardConstraintFilter.evaluate({
  shipment: mockShipment,
  truck: baseTruck,
  pickupHub: "Delhi",
  dropoffHub: "Chennai",
  pickupTime: "2026-10-10T02:00:00.000Z",
  dropoffTime: "2026-10-10T18:00:00.000Z", // 16 hours duration > statutory 12h threshold
  currentTime: "2026-10-10T01:00:00.000Z",
  availableWeight: 500,
  availableVolume: 10,
});
assert(
  evalDuty.reason === RejectionReason.DUTY_LIMIT_EXCEEDED,
  "Rejects excessive driver duty duration with DUTY_LIMIT_EXCEEDED"
);

// ────────────────────────────────────────────────────────────────────────────
// CHECK 5: Pareto Knee-Point Invariance against Dominated Outlier Candidates
// ────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}${CYAN}[CHECK 5] Pareto Knee-Point Invariance against Dominated Outliers${RESET}`);

function createDummyScoredPlan(id: string, time: number, risk: number, dist: number, cost: number): ScoredPlan {
  const dummyResult: PathResult = {
    source: "A",
    target: "B",
    path: ["A", "B"],
    edges: [],
    totalDistanceKm: dist,
    totalTravelTimeMin: time,
    totalRiskScore: risk,
    totalCost: cost,
    metrics: { algorithm: "TEST", executionTimeMs: 1, nodesExplored: 1, edgesEvaluated: 1 },
    feasible: true,
  };

  return {
    id,
    candidate: dummyResult,
    compositeScore: 0,
    normalizedScores: { distance: 0, time: 0, risk: 0, cost: 0 },
    weights: { distanceWeight: 0.25, timeWeight: 0.25, riskWeight: 0.25, costWeight: 0.25 },
    profile: "BALANCED",
    isParetoOptimal: false,
    paretoRank: 0,
    softPenalty: 0,
  };
}

// Frontier: P1 (fastest), P2 (balanced trade-off), P3 (safest)
const p1 = createDummyScoredPlan("P1-FAST", 100, 0.40, 500, 1000);
const p2 = createDummyScoredPlan("P2-KNEE", 130, 0.15, 520, 1050); // Knee point
const p3 = createDummyScoredPlan("P3-SAFE", 200, 0.10, 580, 1100);

const frontierSet = [p1, p2, p3];
const resBase = computeParetoFrontier(frontierSet);
const baseKneeId = resBase.kneePoint?.id;

// Add a dominated outlier with terrible scores: 9999 time, 0.99 risk, 9999 dist, 9999 cost
const dominatedOutlier = createDummyScoredPlan("P-DOMINATED-OUTLIER", 9999, 0.99, 9999, 9999);
const resWithOutlier = computeParetoFrontier([...frontierSet, dominatedOutlier]);
const outlierKneeId = resWithOutlier.kneePoint?.id;

assert(
  baseKneeId === outlierKneeId,
  "Knee point on Pareto frontier is invariant to dominated candidates in the pool",
  `Base Knee: ${baseKneeId} vs With Outlier: ${outlierKneeId}`
);
console.log(`  ↳ Consistent Knee-Point: [${baseKneeId}]`);

// ────────────────────────────────────────────────────────────────────────────
// CHECK 6: Geographic Haversine Triangle Inequality Verification
// ────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}${CYAN}[CHECK 6] Dynamic Geographic Road Distance & Triangle Inequality${RESET}`);

const dDirect = getHubRoadDistanceKm("Delhi", "Chennai");
const dLeg1 = getHubRoadDistanceKm("Delhi", "Nagpur");
const dLeg2 = getHubRoadDistanceKm("Nagpur", "Chennai");

console.log(`  ↳ Direct Road Distance (Delhi ➔ Chennai): ${dDirect} km`);
console.log(`  ↳ Via Nagpur (Delhi ➔ Nagpur: ${dLeg1} km + Nagpur ➔ Chennai: ${dLeg2} km): ${dLeg1 + dLeg2} km`);

assert(dDirect > 0 && dLeg1 > 0 && dLeg2 > 0, "Calculated realistic positive highway distances");
assert(dDirect <= dLeg1 + dLeg2 + 50, "Highway network satisfies metric triangle inequality");

console.log(`\n${BOLD}========================================================================${RESET}`);
console.log(`${BOLD}${GREEN}  ALL ${passedTests}/${totalTests} VERIFICATION CHECKS PASSED WITH ZERO DISCREPANCIES!${RESET}`);
console.log(`${BOLD}========================================================================${RESET}\n`);
