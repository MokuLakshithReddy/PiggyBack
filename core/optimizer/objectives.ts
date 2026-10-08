import { PathResult } from "../algorithms/types";
import { ObjectiveProfile, ObjectiveWeights, ScoredPlan } from "./types";

export const OBJECTIVE_PROFILES: Record<ObjectiveProfile, ObjectiveWeights> = {
  FASTEST: {
    timeWeight: 0.70,
    distanceWeight: 0.20,
    riskWeight: 0.10,
    costWeight: 0.00,
  },
  SAFEST: {
    riskWeight: 0.60,
    timeWeight: 0.25,
    distanceWeight: 0.15,
    costWeight: 0.00,
  },
  BALANCED: {
    timeWeight: 0.35,
    distanceWeight: 0.30,
    riskWeight: 0.35,
    costWeight: 0.00,
  },
  ECONOMY: {
    costWeight: 0.60,
    distanceWeight: 0.20,
    timeWeight: 0.20,
    riskWeight: 0.00,
  },
  CUSTOM: {
    timeWeight: 0.25,
    distanceWeight: 0.25,
    riskWeight: 0.25,
    costWeight: 0.25,
  },
};

/**
 * Normalizes metrics across candidates to [0, 1] range to avoid magnitude distortion,
 * then computes the composite objective score based on chosen weights.
 */
export function scoreCandidates(
  candidates: { candidate: PathResult; softPenalty: number }[],
  profile: ObjectiveProfile = "BALANCED",
  customWeights?: Partial<ObjectiveWeights>
): ScoredPlan[] {
  if (candidates.length === 0) return [];

  const weights: ObjectiveWeights = {
    ...OBJECTIVE_PROFILES[profile],
    ...(customWeights || {}),
  };

  // Find min and max for each objective across the pool
  let minDistance = Infinity, maxDistance = -Infinity;
  let minTime = Infinity, maxTime = -Infinity;
  let minRisk = Infinity, maxRisk = -Infinity;
  let minCost = Infinity, maxCost = -Infinity;

  for (const item of candidates) {
    const c = item.candidate;
    if (c.totalDistanceKm < minDistance) minDistance = c.totalDistanceKm;
    if (c.totalDistanceKm > maxDistance) maxDistance = c.totalDistanceKm;

    if (c.totalTravelTimeMin < minTime) minTime = c.totalTravelTimeMin;
    if (c.totalTravelTimeMin > maxTime) maxTime = c.totalTravelTimeMin;

    if (c.totalRiskScore < minRisk) minRisk = c.totalRiskScore;
    if (c.totalRiskScore > maxRisk) maxRisk = c.totalRiskScore;

    if (c.totalCost < minCost) minCost = c.totalCost;
    if (c.totalCost > maxCost) maxCost = c.totalCost;
  }

  // Safe range denominators
  const distRange = maxDistance - minDistance || 1;
  const timeRange = maxTime - minTime || 1;
  const riskRange = maxRisk - minRisk || 1;
  const costRange = maxCost - minCost || 1;

  return candidates.map((item, idx) => {
    const c = item.candidate;

    const normDistance = (c.totalDistanceKm - minDistance) / distRange;
    const normTime = (c.totalTravelTimeMin - minTime) / timeRange;
    const normRisk = (c.totalRiskScore - minRisk) / riskRange;
    const normCost = (c.totalCost - minCost) / costRange;

    // Linear scalarization formula
    const rawScore =
      weights.distanceWeight * normDistance +
      weights.timeWeight * normTime +
      weights.riskWeight * normRisk +
      weights.costWeight * normCost;

    // Add soft penalty impact
    const compositeScore = rawScore + (item.softPenalty / 100);

    return {
      id: `PLAN-${idx + 1}-${c.metrics.algorithm.toUpperCase().replace(/[^A-Z0-9]/g, "")}`,
      candidate: c,
      compositeScore: Math.round(compositeScore * 10000) / 10000,
      normalizedScores: {
        distance: Math.round(normDistance * 1000) / 1000,
        time: Math.round(normTime * 1000) / 1000,
        risk: Math.round(normRisk * 1000) / 1000,
        cost: Math.round(normCost * 1000) / 1000,
      },
      weights,
      profile,
      isParetoOptimal: false, // Calculated by pareto module
      paretoRank: 0,
      softPenalty: item.softPenalty,
    };
  });
}
