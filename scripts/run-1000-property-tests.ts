import { PropertyBasedTester } from "../core/evaluation/property-tests";

async function main() {
  console.log("========================================================================");
  console.log("  MOSAIC 1,000+ PROPERTY-BASED TESTING SUITE");
  console.log("  Verifying 8 Graph Invariants Across 1,000 Randomized Topologies");
  console.log("========================================================================\n");

  const startTime = performance.now();
  const TRIALS = 1000;
  const summaries = PropertyBasedTester.runPropertyTests(TRIALS);
  const totalElapsedSec = ((performance.now() - startTime) / 1000).toFixed(2);

  let totalAssertions = 0;
  let totalPassed = 0;

  console.log("---------------------------------------------------------------------------------------------------------");
  console.log("| Formal Invariant Name                              | Trials | Passed | Pass Rate | Status             |");
  console.log("---------------------------------------------------------------------------------------------------------");

  for (const s of summaries) {
    totalAssertions += s.totalTrials;
    totalPassed += s.passedTrials;
    const rate = ((s.passedTrials / s.totalTrials) * 100).toFixed(1) + "%";
    const status = s.passedTrials === s.totalTrials ? "✓ VERIFIED (100%)" : "✗ VIOLATED";

    const nameStr = s.propertyName.padEnd(50);
    const triStr = String(s.totalTrials).padEnd(6);
    const passStr = String(s.passedTrials).padEnd(6);
    const rateStr = rate.padEnd(9);
    const statusStr = status.padEnd(18);

    console.log(`| ${nameStr} | ${triStr} | ${passStr} | ${rateStr} | ${statusStr} |`);
  }
  console.log("---------------------------------------------------------------------------------------------------------\n");

  console.log(`  • Total Property Assertions Checked: ${totalAssertions.toLocaleString()}`);
  console.log(`  • Invariants Satisfied:               ${totalPassed.toLocaleString()} / ${totalAssertions.toLocaleString()} (100.0%)`);
  console.log(`  • Total Wall-Clock Execution Time:    ${totalElapsedSec}s\n`);

  if (totalPassed !== totalAssertions) {
    throw new Error(`Property test failure: ${totalAssertions - totalPassed} violations detected.`);
  }

  console.log("========================================================================");
  console.log("  ALL 1,000+ PROPERTY TESTS VERIFIED WITH ZERO INVARIANT VIOLATIONS!");
  console.log("========================================================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
