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

  // Identify Knee Point: Normalized strictly across the Pareto frontier's Ideal and Nadir bounds
  // This guarantees mathematical invariance against dominated candidates in the pool.
  let kneePoint: ScoredPlan | null = null;
  if (frontier.length > 0) {
    let idealT = Infinity, nadirT = -Infinity;
    let idealR = Infinity, nadirR = -Infinity;
    let idealD = Infinity, nadirD = -Infinity;
    let idealC = Infinity, nadirC = -Infinity;

    for (const f of frontier) {
      const c = f.candidate;
      if (c.totalTravelTimeMin < idealT) idealT = c.totalTravelTimeMin;
      if (c.totalTravelTimeMin > nadirT) nadirT = c.totalTravelTimeMin;

      if (c.totalRiskScore < idealR) idealR = c.totalRiskScore;
      if (c.totalRiskScore > nadirR) nadirR = c.totalRiskScore;

      if (c.totalDistanceKm < idealD) idealD = c.totalDistanceKm;
      if (c.totalDistanceKm > nadirD) nadirD = c.totalDistanceKm;

      if (c.totalCost < idealC) idealC = c.totalCost;
      if (c.totalCost > nadirC) nadirC = c.totalCost;
    }

    const rangeT = nadirT - idealT || 1;
    const rangeR = nadirR - idealR || 1;
    const rangeD = nadirD - idealD || 1;
    const rangeC = nadirC - idealC || 1;

    let minUtopiaDist = Infinity;
    for (const f of frontier) {
      const c = f.candidate;
      const normT = (c.totalTravelTimeMin - idealT) / rangeT;
      const normR = (c.totalRiskScore - idealR) / rangeR;
      const normD = (c.totalDistanceKm - idealD) / rangeD;
      const normC = (c.totalCost - idealC) / rangeC;

      const utopiaDist = Math.sqrt(normT * normT + normR * normR + normD * normD + normC * normC);
      if (utopiaDist < minUtopiaDist) {
        minUtopiaDist = utopiaDist;
        kneePoint = f;
      }
    }
  }

  return {
    frontier,
    rankedPlans: [...plans].sort((a, b) => a.paretoRank - b.paretoRank || a.compositeScore - b.compositeScore),
    kneePoint,
  };
}
