import { ScoredPlan } from "./types";

/**
 * Checks if plan A Pareto-dominates plan B.
 * Minimization problem across: time, risk, distance, cost.
 */
export function dominates(a: ScoredPlan, b: ScoredPlan): boolean {
  const aCand = a.candidate;
  const bCand = b.candidate;

  const noWorse =
    aCand.totalTravelTimeMin <= bCand.totalTravelTimeMin &&
    aCand.totalRiskScore <= bCand.totalRiskScore &&
    aCand.totalDistanceKm <= bCand.totalDistanceKm &&
    aCand.totalCost <= bCand.totalCost;

  const strictlyBetter =
    aCand.totalTravelTimeMin < bCand.totalTravelTimeMin ||
    aCand.totalRiskScore < bCand.totalRiskScore ||
    aCand.totalDistanceKm < bCand.totalDistanceKm ||
    aCand.totalCost < bCand.totalCost;

  return noWorse && strictlyBetter;
}

/**
 * Computes non-dominated sorting across all feasible plans.
 * Sets `isParetoOptimal = true` and `paretoRank = 1` for solutions on the frontier.
 */
export function computeParetoFrontier(plans: ScoredPlan[]): {
  frontier: ScoredPlan[];
  rankedPlans: ScoredPlan[];
  kneePoint: ScoredPlan | null;
} {
  if (plans.length === 0) {
    return { frontier: [], rankedPlans: [], kneePoint: null };
  }

  // Fast Non-Dominated Sorting
  const dominationCounts = new Map<string, number>();
  const dominatedSets = new Map<string, string[]>();

  for (const p of plans) {
    dominationCounts.set(p.id, 0);
    dominatedSets.set(p.id, []);
  }

  for (let i = 0; i < plans.length; i++) {
    for (let j = 0; j < plans.length; j++) {
      if (i === j) continue;
      const p1 = plans[i];
      const p2 = plans[j];

      if (dominates(p1, p2)) {
        dominatedSets.get(p1.id)!.push(p2.id);
      } else if (dominates(p2, p1)) {
        dominationCounts.set(p1.id, (dominationCounts.get(p1.id) || 0) + 1);
      }
    }
  }

  const frontier: ScoredPlan[] = [];
  const planMap = new Map(plans.map((p) => [p.id, p]));

  for (const p of plans) {
    const dCount = dominationCounts.get(p.id) || 0;
    if (dCount === 0) {
      p.isParetoOptimal = true;
      p.paretoRank = 1;
      frontier.push(p);
    } else {
      p.isParetoOptimal = false;
      p.paretoRank = 1 + dCount;
    }
  }

  // Identify Knee Point: solution on the frontier closest to the ideal Utopia point (0, 0, 0, 0)
  let kneePoint: ScoredPlan | null = null;
  let minUtopiaDist = Infinity;

  for (const f of frontier) {
    const { time, risk, distance, cost } = f.normalizedScores;
    const utopiaDist = Math.sqrt(time * time + risk * risk + distance * distance + cost * cost);
    if (utopiaDist < minUtopiaDist) {
      minUtopiaDist = utopiaDist;
      kneePoint = f;
    }
  }

  return {
    frontier,
    rankedPlans: [...plans].sort((a, b) => a.paretoRank - b.paretoRank || a.compositeScore - b.compositeScore),
    kneePoint,
  };
}
