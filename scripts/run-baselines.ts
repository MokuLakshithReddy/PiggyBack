import { OptimizationBaselineComparison } from "../core/evaluation/baselines";

async function main() {
  console.log("==========================================================================================================");
  console.log("  MOSAIC OPTIMIZATION BASELINE BENCHMARK (500 SCENARIOS)");
  console.log("  Shortest Path vs 5 Weighted-Sum Profiles vs Pareto + Knee-Point Selection");
  console.log("  Statistical Distribution: Mean, Median, p95, Standard Deviation, and 95% Confidence Interval (CI95)");
  console.log("==========================================================================================================\n");

  const scenariosCount = 500;
  const report = OptimizationBaselineComparison.runComparison(scenariosCount);

  console.log("---------------------------------------------------------------------------------------------------------------------------------------------");
  console.log("| Method Name                     | Dist Mean (p95)    | Time Mean (p95)    | Risk Mean [CI95]    | Cost Mean [CI95]      | SLA % | Dom | Runtime |");
  console.log("---------------------------------------------------------------------------------------------------------------------------------------------");

  for (const m of report.results) {
    const nameStr = m.methodName.padEnd(31);
    const distStr = `${m.distanceKmDist.mean} (${m.distanceKmDist.p95})km`.padEnd(18);
    const timeStr = `${m.travelTimeMinDist.mean} (${m.travelTimeMinDist.p95})m`.padEnd(18);
    const riskStr = `${m.riskScoreDist.mean.toFixed(2)} [${m.riskScoreDist.ci95[0]}-${m.riskScoreDist.ci95[1]}]`.padEnd(19);
    const costStr = `₹${m.costDist.mean} [₹${m.costDist.ci95[0]}-₹${m.costDist.ci95[1]}]`.padEnd(21);
    const slaStr = `${m.slaBreachRatePercent}%`.padEnd(5);
    const domStr = String(m.paretoDominatedCount).padEnd(3);
    const runStr = `${m.runtimeMsDist.mean.toFixed(2)}ms`.padEnd(7);

    console.log(`| ${nameStr} | ${distStr} | ${timeStr} | ${riskStr} | ${costStr} | ${slaStr} | ${domStr} | ${runStr} |`);
  }
  console.log("---------------------------------------------------------------------------------------------------------------------------------------------\n");

  console.log("[EMPIRICAL DISTRIBUTION INSIGHTS]");
  console.log(`  • Evaluated Scenarios:         ${report.totalScenarios} randomized graph corridors`);
  console.log(`  • Pareto Cost Advantage:       ${report.comparativeInsights.paretoVsShortestCostSavingsPercent}% reduction vs single-objective shortest path`);
  console.log(`  • Pareto Risk Reduction:       ${report.comparativeInsights.paretoVsWeightedSumRiskReductionPercent}% lower risk exposure vs balanced weighted sum`);
  console.log(`  • Pareto Dominance Rate:       MOSAIC Pareto-dominates ${report.comparativeInsights.paretoDominanceRateOverBaselines}% of shortest path baseline solutions`);
  console.log(`  • SLA Reliability Guarantee:   ${report.comparativeInsights.kneePointBalanceSummary}\n`);

  console.log("==========================================================================================================");
  console.log("  OPTIMIZATION BASELINE BENCHMARK COMPLETED SUCCESSFULLY!");
  console.log("==========================================================================================================");
}

main().catch(console.error);
