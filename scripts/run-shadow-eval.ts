import { ShadowPlannerEvaluator } from "../core/evaluation/shadow-eval";

async function main() {
  console.log("========================================================================");
  console.log("  MOSAIC SHADOW PLANNER QUANTITATIVE EVALUATION");
  console.log("  Topological Disjointness, Fallback Rates, Overlap & Execution Time");
  console.log("========================================================================\n");

  const metrics = ShadowPlannerEvaluator.runEvaluation(60);

  console.log("----------------------------------------------------------------------------------");
  console.log("| Metric Evaluation Dimension                    | Measured Value                |");
  console.log("----------------------------------------------------------------------------------");
  console.log(`| Total Scenarios Evaluated                      | ${String(metrics.totalScenariosEvaluated).padEnd(29)} |`);
  console.log(`| Edge-Disjoint Plans (0% Overlap)               | ${String(metrics.edgeDisjointCount).padEnd(29)} |`);
  console.log(`| Penalized Overlap Fallbacks                    | ${String(metrics.penalizedOverlapCount).padEnd(29)} |`);
  console.log(`| Edge-Disjoint Success Rate                     | ${(metrics.edgeDisjointPercent + "%").padEnd(29)} |`);
  console.log(`| Fallback Overlap Rate                          | ${(metrics.fallbackPercent + "%").padEnd(29)} |`);
  console.log(`| Mean Overlap on Fallbacks                      | ${(metrics.averageOverlapPercentOnFallback + "%").padEnd(29)} |`);
  console.log(`| Mean Independent Backup Distance               | ${(metrics.averageIndependentDistanceKm + " km").padEnd(29)} |`);
  console.log(`| Mean Shared Distance on Fallbacks              | ${(metrics.averageSharedDistanceKm + " km").padEnd(29)} |`);
  console.log(`| Mean Shadow Plan Runtime                       | ${(metrics.averageRuntimeMs.toFixed(2) + " ms").padEnd(29)} |`);
  console.log("----------------------------------------------------------------------------------\n");

  console.log("[ARCHITECTURAL GUARANTEE SUMMARY]");
  console.log(`  • 100% Deterministic Guarantee: Every backup route is verified and classified as EDGE_DISJOINT or PENALIZED_OVERLAP.`);
  console.log(`  • Zero Ambiguity: Exact shared kilometer count and corridor overlap percentages are attached to receipts.`);
  console.log(`  • Operational Redundancy: Solvers achieve ${metrics.edgeDisjointPercent}% full physical disjointness across interstate routes.\n`);

  console.log("========================================================================");
  console.log("  SHADOW PLANNER EVALUATION COMPLETED SUCCESSFULLY!");
  console.log("========================================================================");
}

main().catch(console.error);
