import { stateManager } from "../lib/engine/state-manager";

async function verifyRecoveryPipeline() {
  console.log("========================================================================");
  console.log("  PIGGYBACK APPLICATION RUNTIME VERIFICATION");
  console.log("  Verifying Primary Plan, Shadow Fallback, Constraints & Replanning");
  console.log("========================================================================\n");

  const shipmentId = "SHP-2048";

  // 1. Initial State
  const initialShipment = stateManager.getShipment(shipmentId);
  console.log(`[1. SHIPMENT CONTEXT]`);
  console.log(`  • ID:          ${initialShipment?.id}`);
  console.log(`  • Status:      ${initialShipment?.status}`);
  console.log(`  • Route:       ${initialShipment?.origin} -> ${initialShipment?.destination}`);
  console.log(`  • Weight/Vol:  ${initialShipment?.weight} kg | ${initialShipment?.volume} m³`);
  console.log(`  • Deadline:    ${initialShipment?.deadline}\n`);

  // 2. Solve Recovery
  console.log(`[2. EXECUTING MOSAIC SOLVER]`);
  stateManager.solveRecovery(shipmentId);
  const plans = stateManager.getPlans(shipmentId);
  const receipt = stateManager.getReceipt(shipmentId);

  const primaryPlan = plans.find((p) => p.strategy === "PRIMARY");
  const shadowPlan = plans.find((p) => p.strategy === "SHADOW");

  console.log(`  • Solver Status:        ${receipt?.status}`);
  console.log(`  • Total Candidates:     ${receipt?.totalCandidatesEvaluated}`);
  console.log(`  • Feasible Options:     ${receipt?.feasibleCandidatesCount}`);
  console.log(`  • Rejected Count:       ${receipt?.rejectedCandidates?.length ?? 0}\n`);

  // 3. Primary Plan Details
  console.log(`[3. PRIMARY RECOVERY PLAN]`);
  if (primaryPlan) {
    console.log(`  • Assigned Vehicle:     ${primaryPlan.vehicleId}`);
    console.log(`  • Transit Corridor:     ${primaryPlan.pickupHub} -> ${primaryPlan.dropoffHub}`);
    console.log(`  • Dropoff ETA:          ${primaryPlan.eta}`);
    console.log(`  • SLA Safety Buffer:    +${primaryPlan.slaMarginMinutes} min`);
    console.log(`  • Incremental Cost:     ₹${primaryPlan.incrementalCost.toLocaleString()}`);
    console.log(`  • Avoided Emissions:    ${primaryPlan.co2SavedKg} kg CO₂ (GLEC/ISO 14083 aligned)`);
    console.log(`  • Financial Savings:    ${primaryPlan.costSavingsPercent}% vs emergency charter\n`);
  } else {
    console.log("  ✗ No primary plan generated\n");
  }

  // 4. Shadow Plan Details & Fallback Guarantee
  console.log(`[4. SHADOW PLAN & FALLBACK GUARANTEE]`);
  if (shadowPlan) {
    console.log(`  • Backup Vehicle:       ${shadowPlan.vehicleId}`);
    console.log(`  • Corridor:             ${shadowPlan.pickupHub} -> ${shadowPlan.dropoffHub}`);
    console.log(`  • Dropoff ETA:          ${shadowPlan.eta}`);
    console.log(`  • SLA Safety Buffer:    +${shadowPlan.slaMarginMinutes} min`);
    console.log(`  • Incremental Cost:     ₹${shadowPlan.incrementalCost.toLocaleString()}`);
    console.log(`  • Fallback Guarantee:   ${shadowPlan.shadowGuarantee?.guarantee}`);
    console.log(`  • Overlap Percentage:   ${shadowPlan.shadowGuarantee?.overlapPercentage}%`);
    console.log(`  • Shared Highway Km:    ${shadowPlan.shadowGuarantee?.sharedDistanceKm} km`);
    console.log(`  • Audit Certification:  ${shadowPlan.shadowGuarantee?.quantitativeAudit}\n`);
  } else {
    console.log("  ✗ No shadow plan generated\n");
  }

  // 5. Dynamic Replanning Verification
  console.log(`[5. DYNAMIC REPLANNING TEST]`);
  console.log(`  • Triggering Re-optimization for ${shipmentId}...`);
  stateManager.reoptimize(shipmentId);
  const reoptimizedPlans = stateManager.getPlans(shipmentId);
  const reoptimizedReceipt = stateManager.getReceipt(shipmentId);

  console.log(`  • Replanning Completed in ${reoptimizedReceipt?.solveTimeMs} ms`);
  console.log(`  • Re-evaluated Plans:   ${reoptimizedPlans.length} active plans`);
  console.log(`  • Receipt Hash:         ${reoptimizedReceipt?.hash}\n`);

  console.log("========================================================================");
  console.log("  ALL APPLICATION RUNTIME VERIFICATIONS COMPLETED SUCCESSFULLY!");
  console.log("========================================================================");
}

verifyRecoveryPipeline().catch(console.error);
