import { OptimizationBaselineComparison } from "../core/evaluation/baselines";

async function main() {
  console.log("========================================================================");
  console.log("  MOSAIC OPTIMIZATION BASELINE COMPARISON");
  console.log("  Shortest Path vs Weighted Sum vs Pareto + Knee-Point Selection");
  console.log("========================================================================\n");

  const report = OptimizationBaselineComparison.runComparison(25);

  console.log("---------------------------------------------------------------------------------------------------------------------------------");
  console.log("| Method Name                     | Dist (km) | Time (min) | Risk  | Cost (₹) | SLA Breach % | Dominated Count | Runtime (ms) |");
  console.log("---------------------------------------------------------------------------------------------------------------------------------");

  for (const m of report.results) {
    const nameStr = m.methodName.padEnd(31);
    const distStr = `${m.avgDistanceKm} km`.padEnd(9);
    const timeStr = `${m.avgTravelTimeMin}m`.padEnd(10);
    const riskStr = m.avgRiskScore.toFixed(3).padEnd(5);
    const costStr = `₹${m.avgCost}`.padEnd(8);
    const slaStr = `${m.slaBreachRatePercent}%`.padEnd(12);
    const domStr = String(m.paretoDominatedCount).padEnd(15);
    const runStr = `${m.runtimeMs.toFixed(2)} ms`.padEnd(12);

    console.log(`| ${nameStr} | ${distStr} | ${timeStr} | ${riskStr} | ${costStr} | ${slaStr} | ${domStr} | ${runStr} |`);
  }
  console.log("---------------------------------------------------------------------------------------------------------------------------------\n");

  console.log("[EMPIRICAL FINDINGS]");
  console.log(`  • Pareto Cost Advantage:     ${report.comparativeInsights.paretoVsShortestCostSavingsPercent}% reduction vs single-objective shortest path`);
  console.log(`  • Pareto Risk Reduction:     ${report.comparativeInsights.paretoVsWeightedSumRiskReductionPercent}% lower risk exposure vs static weighted sum`);
  console.log(`  • SLA Reliability Guarantee: ${report.comparativeInsights.kneePointBalanceSummary}\n`);

  console.log("========================================================================");
  console.log("  OPTIMIZATION BASELINE BENCHMARK COMPLETED SUCCESSFULLY!");
  console.log("========================================================================");
}

main().catch(console.error);
