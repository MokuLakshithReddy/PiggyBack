import { CandidateDiversityExperiment } from "../core/evaluation/diversity-experiment";

async function main() {
  console.log("========================================================================");
  console.log("  MOSAIC CANDIDATE DIVERSITY EXPERIMENT (K = 5, 10, 25, 50, 100)");
  console.log("  Pareto Frontier Cardinality, Solution Quality & Algorithmic Runtime");
  console.log("========================================================================\n");

  const kValues = [5, 10, 25, 50, 100];
  const report = CandidateDiversityExperiment.runExperiment(kValues, 5);

  console.log("---------------------------------------------------------------------------------------------------------");
  console.log("| K Target | Unique Cands | Feasible | Pareto Frontier | Solution Quality (Score) | Runtime (ms) |");
  console.log("---------------------------------------------------------------------------------------------------------");

  for (const pt of report.results) {
    const kStr = String(pt.K).padEnd(8);
    const candStr = String(pt.candidateCount).padEnd(12);
    const feasStr = String(pt.feasibleCandidates).padEnd(8);
    const paretoStr = String(pt.paretoFrontierSize).padEnd(15);
    const qualStr = pt.solutionQualityScore.toFixed(3).padEnd(24);
    const runStr = `${pt.runtimeMs.toFixed(2)} ms`.padEnd(12);

    console.log(`| ${kStr} | ${candStr} | ${feasStr} | ${paretoStr} | ${qualStr} | ${runStr} |`);
  }
  console.log("---------------------------------------------------------------------------------------------------------\n");

  console.log(`[EXPERIMENT INSIGHTS & THEORETICAL ANALYSIS]`);
  console.log(`  • Pareto Frontier Expansion Ratio: ${report.insights.paretoExpansionRatio}x expansion from K=5 to K=100`);
  console.log(`  • Runtime Scaling Factor:          ${report.insights.runtimeScalingFactor}x (sub-linear due to heap-backed Yen's KSP)`);
  console.log(`  • Optimal Pareto-Efficiency Knee:  K = ${report.insights.optimalK} (maximum marginal solution discovery per millisecond)`);
  console.log(`  • Diminishing Returns Threshold:   K = ${report.insights.diminishingReturnsThreshold} (Pareto frontier stabilizes while runtime scales)\n`);

  console.log("========================================================================");
  console.log("  CANDIDATE DIVERSITY EXPERIMENT COMPLETED SUCCESSFULLY!");
  console.log("========================================================================");
}

main().catch(console.error);
