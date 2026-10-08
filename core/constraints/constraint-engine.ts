import { PathResult } from "../algorithms/types";
import { ConstraintRule, FilterResult, PlanContext } from "./types";

/**
 * High-performance Constraint Engine
 * Evaluates candidate paths against modular Hard and Soft constraints.
 */
export class ConstraintEngine {
  private rules: Map<string, ConstraintRule> = new Map();

  constructor() {
    this.registerDefaultRules();
  }

  public registerRule(rule: ConstraintRule): void {
    this.rules.set(rule.id, rule);
  }

  public removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  public getRules(): ConstraintRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Evaluates a candidate against all registered constraints.
   */
  public evaluate(candidate: PathResult, context: PlanContext): FilterResult {
    const violated: string[] = [];
    let softPenaltyTotal = 0;
    let isFeasible = true;

    for (const rule of this.rules.values()) {
      const result = rule.validate(candidate, context);

      if (!result.satisfied) {
        if (rule.isHard) {
          isFeasible = false;
          violated.push(result.reason || `Violated ${rule.name}`);
        } else {
          softPenaltyTotal += result.penaltyScore || 50;
        }
      }
    }

    return {
      candidate,
      isFeasible,
      violatedConstraints: violated,
      softPenaltyTotal,
    };
  }

  /**
   * Filters a collection of candidate paths into feasible and infeasible sets,
   * returning exact rejection analytics.
   */
  public filterCandidates(
    candidates: PathResult[],
    context: PlanContext
  ): {
    feasible: FilterResult[];
    infeasible: FilterResult[];
    rejectionBreakdown: Record<string, number>;
  } {
    const feasible: FilterResult[] = [];
    const infeasible: FilterResult[] = [];
    const rejectionBreakdown: Record<string, number> = {};

    for (const c of candidates) {
      const evalResult = this.evaluate(c, context);
      if (evalResult.isFeasible) {
        feasible.push(evalResult);
      } else {
        infeasible.push(evalResult);
        for (const violation of evalResult.violatedConstraints) {
          rejectionBreakdown[violation] = (rejectionBreakdown[violation] || 0) + 1;
        }
      }
    }

    return { feasible, infeasible, rejectionBreakdown };
  }

  private registerDefaultRules(): void {
    // 1. Capacity Hard Constraint: All edges must support requested cargo weight
    this.registerRule({
      id: "CAPACITY_WEIGHT",
      name: "Vehicle/Corridor Weight Capacity",
      type: "CAPACITY",
      isHard: true,
      validate: (candidate, context) => {
        for (const edge of candidate.edges) {
          const availableCapacity = edge.capacityKg - (edge.currentLoadKg || 0);
          if (availableCapacity < context.cargoWeightKg) {
            return {
              satisfied: false,
              reason: `Insufficient capacity on corridor [${edge.source} -> ${edge.target}]: needed ${context.cargoWeightKg}kg, available ${availableCapacity}kg`,
            };
          }
        }
        return { satisfied: true };
      },
    });

    // 2. Deadline Hard Constraint: Travel time must meet SLA deadline
    this.registerRule({
      id: "SLA_DEADLINE",
      name: "SLA Delivery Deadline",
      type: "DEADLINE",
      isHard: true,
      validate: (candidate, context) => {
        if (candidate.totalTravelTimeMin > context.slaDeadlineMinutes) {
          const breachMinutes = Math.round(candidate.totalTravelTimeMin - context.slaDeadlineMinutes);
          return {
            satisfied: false,
            reason: `SLA deadline breach: ETA of ${candidate.totalTravelTimeMin} min exceeds deadline (${context.slaDeadlineMinutes} min) by ${breachMinutes} min`,
          };
        }
        return { satisfied: true };
      },
    });

    // 3. Risk Ceiling Hard Constraint
    this.registerRule({
      id: "RISK_CEILING",
      name: "Maximum Acceptable Corridor Risk",
      type: "RISK_CEILING",
      isHard: true,
      validate: (candidate, context) => {
        const threshold = context.maxAcceptableRiskScore ?? 0.75;
        if (candidate.totalRiskScore > threshold) {
          return {
            satisfied: false,
            reason: `Excessive risk score ${candidate.totalRiskScore.toFixed(3)} exceeds safety limit of ${threshold.toFixed(2)}`,
          };
        }
        return { satisfied: true };
      },
    });

    // 4. Road Status Hard Constraint: Path must not traverse BLOCKED segments
    this.registerRule({
      id: "ROAD_ACTIVE_STATUS",
      name: "Active Road Infrastructure",
      type: "ROAD_STATUS",
      isHard: true,
      validate: (candidate) => {
        const blockedEdge = candidate.edges.find((e) => e.status === "BLOCKED");
        if (blockedEdge) {
          return {
            satisfied: false,
            reason: `Path traverses blocked edge [${blockedEdge.source} -> ${blockedEdge.target}] (${blockedEdge.id})`,
          };
        }
        return { satisfied: true };
      },
    });

    // 5. Critical Priority Soft/Hard Constraint
    this.registerRule({
      id: "PRIORITY_PROTECTION",
      name: "High Priority Congestion Immunity",
      type: "PRIORITY",
      isHard: false,
      validate: (candidate, context) => {
        const congestedCount = candidate.edges.filter((e) => e.status === "CONGESTED").length;
        if (congestedCount > 0) {
          const penaltyMultiplier = context.priorityLevel === 1 ? 100 : context.priorityLevel === 2 ? 40 : 15;
          return {
            satisfied: false,
            penaltyScore: congestedCount * penaltyMultiplier,
            reason: `Traverses ${congestedCount} congested sectors with priority level ${context.priorityLevel}`,
          };
        }
        return { satisfied: true };
      },
    });
  }
}
