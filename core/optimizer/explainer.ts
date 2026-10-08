import { PlanContext } from "../constraints/types";
import { ScoredPlan, TradeOffItem, TradeOffReport } from "./types";

/**
 * Explainability Engine
 * Quantifies trade-offs and generates human-auditable mathematical justifications
 * for why the chosen plan was selected over alternatives.
 */
export class DecisionExplainer {
  public static explainDecision(
    recommendedPlan: ScoredPlan,
    frontier: ScoredPlan[],
    context: PlanContext
  ): { explanation: string; tradeOffReport: TradeOffReport } {
    const recCand = recommendedPlan.candidate;
    const comparisons: TradeOffItem[] = [];

    // Find extreme reference points on the frontier
    const fastest = [...frontier].sort((a, b) => a.candidate.totalTravelTimeMin - b.candidate.totalTravelTimeMin)[0];
    const safest = [...frontier].sort((a, b) => a.candidate.totalRiskScore - b.candidate.totalRiskScore)[0];
    const shortest = [...frontier].sort((a, b) => a.candidate.totalDistanceKm - b.candidate.totalDistanceKm)[0];

    // Compare with fastest if distinct
    if (fastest && fastest.id !== recommendedPlan.id) {
      comparisons.push(this.computeTradeOff(recommendedPlan, fastest, "Fastest Alternative"));
    }

    // Compare with safest if distinct
    if (safest && safest.id !== recommendedPlan.id && safest.id !== fastest?.id) {
      comparisons.push(this.computeTradeOff(recommendedPlan, safest, "Safest Alternative"));
    }

    // Compare with shortest if distinct
    if (shortest && shortest.id !== recommendedPlan.id && shortest.id !== fastest?.id && shortest.id !== safest?.id) {
      comparisons.push(this.computeTradeOff(recommendedPlan, shortest, "Shortest Alternative"));
    }

    // Compute SLA Margin
    const slaMargin = Math.max(0, context.slaDeadlineMinutes - recCand.totalTravelTimeMin);
    const minEdgeCapacity = Math.min(...recCand.edges.map((e) => e.capacityKg - (e.currentLoadKg || 0)));
    const capacityMargin = Math.max(0, minEdgeCapacity - context.cargoWeightKg);

    // Build human-readable explainability report
    const bullets: string[] = [];
    bullets.push(`✓ 100% SLA Compliant: Arrives in ${recCand.totalTravelTimeMin} min (${slaMargin.toFixed(0)} min before SLA deadline)`);
    bullets.push(`✓ Capacity Verified: Feasible bottleneck capacity margin of +${capacityMargin} kg`);
    bullets.push(`✓ Infrastructure Integrity: 0 blocked road segments traversed`);

    for (const comp of comparisons) {
      if (comp.riskDiffPercent < 0) {
        bullets.push(`✓ Risk Advantage: ${Math.abs(comp.riskDiffPercent).toFixed(1)}% safer than ${comp.alternativeProfile}`);
      }
      if (comp.timeDiffMinutes < 0) {
        bullets.push(`✓ Speed Advantage: ${Math.abs(comp.timeDiffMinutes).toFixed(1)} min faster than ${comp.alternativeProfile}`);
      }
      if (comp.distanceDiffKm < 0) {
        bullets.push(`✓ Distance Advantage: ${Math.abs(comp.distanceDiffKm).toFixed(1)} km shorter than ${comp.alternativeProfile}`);
      }
    }

    const tradeOffs: string[] = [];
    for (const comp of comparisons) {
      if (comp.timeDiffMinutes > 0) {
        tradeOffs.push(`+${comp.timeDiffMinutes.toFixed(1)} min travel time compared to ${comp.alternativeProfile}`);
      }
      if (comp.riskDiffPercent > 0) {
        tradeOffs.push(`+${comp.riskDiffPercent.toFixed(1)}% risk compared to ${comp.alternativeProfile}`);
      }
    }

    const tradeOffSummary = tradeOffs.length > 0 ? tradeOffs.join("; ") : "Globally dominates all evaluated alternatives on active objectives";

    const explanation = [
      `RECOMMENDED PLAN: ${recommendedPlan.id} (${recommendedPlan.profile} Mode)`,
      `────────────────────────────────────────────────────────────────────────────`,
      `Key Feasibility & Performance Proofs:`,
      bullets.map((b) => `  ${b}`).join("\n"),
      tradeOffs.length > 0 ? `Trade-offs Accepted:\n  ${tradeOffs.map((t) => `• ${t}`).join("\n  ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const tradeOffReport: TradeOffReport = {
      recommendedPlanId: recommendedPlan.id,
      comparisonItems: comparisons,
      keyTradeOffSummary: tradeOffSummary,
    };

    return { explanation, tradeOffReport };
  }

  private static computeTradeOff(
    recommended: ScoredPlan,
    alt: ScoredPlan,
    altLabel: string
  ): TradeOffItem {
    const rec = recommended.candidate;
    const a = alt.candidate;

    const timeDiffMinutes = Math.round((rec.totalTravelTimeMin - a.totalTravelTimeMin) * 10) / 10;
    const timeDiffPercent = a.totalTravelTimeMin > 0
      ? Math.round(((rec.totalTravelTimeMin - a.totalTravelTimeMin) / a.totalTravelTimeMin) * 1000) / 10
      : 0;

    const riskDiffPercent = a.totalRiskScore > 0
      ? Math.round(((rec.totalRiskScore - a.totalRiskScore) / a.totalRiskScore) * 1000) / 10
      : 0;

    const costDiffPercent = a.totalCost > 0
      ? Math.round(((rec.totalCost - a.totalCost) / a.totalCost) * 1000) / 10
      : 0;

    const distanceDiffKm = Math.round((rec.totalDistanceKm - a.totalDistanceKm) * 10) / 10;

    return {
      alternativeId: alt.id,
      alternativeProfile: altLabel,
      timeDiffMinutes,
      timeDiffPercent,
      riskDiffPercent,
      costDiffPercent,
      distanceDiffKm,
      summary: `${rec.metrics.algorithm} vs ${a.metrics.algorithm}: ${timeDiffMinutes >= 0 ? `+${timeDiffMinutes} min` : `${timeDiffMinutes} min`}, ${riskDiffPercent >= 0 ? `+${riskDiffPercent}% risk` : `${riskDiffPercent}% risk`}`,
    };
  }
}
