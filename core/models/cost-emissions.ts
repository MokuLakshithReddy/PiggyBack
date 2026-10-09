/**
 * Standard Logistics Cost & Emission Models
 * Grounded in GLEC Framework / ISO 14083-aligned carbon accounting and Indian Freight Operations Standards
 */

export interface CostBreakdown {
  dedicatedCharterCost: number;     // ₹ Cost of sending an emergency hot-shot vehicle
  piggybackCost: number;            // ₹ Marginal cost of piggybacking on scheduled carrier
  financialSavings: number;         // ₹ Total money saved
  savingsPercent: number;           // % savings vs charter
  breakdown: {
    baseCharterMobilization: number;
    charterLinehaul: number;
    charterUrgencySurcharge: number;
    piggybackHandlingFee: number;
    piggybackMarginalFuel: number;
    piggybackTransferFee: number;
  };
}

export interface EmissionBreakdown {
  co2SavedKg: number;              // Net kg CO₂ emissions avoided
  fuelSavedLiters: number;          // Net liters of diesel saved
  emptyMilesAvertedKm: number;      // Deadhead miles eliminated
  charterEmissionsKg: number;       // Emissions if dedicated van dispatched
  marginalPiggybackEmissionsKg: number; // Marginal emissions from cargo payload weight
  methodology: string;
}

export class LogisticsCostModel {
  /**
   * Computes dedicated charter cost vs piggyback shared capacity cost.
   */
  public static calculateCost(params: {
    distanceKm: number;
    cargoWeightKg: number;
    transfers?: number;
    priorityLevel?: 1 | 2 | 3; // 1 = Critical, 2 = High, 3 = Standard
  }): CostBreakdown {
    const { distanceKm, cargoWeightKg, transfers = 0, priorityLevel = 2 } = params;

    // 1. Dedicated Charter (Hot-Shot Van) Model:
    // Base mobilization (dispatch, driver callout): ₹2,200
    const baseCharterMobilization = 2200;
    // Per-km commercial linehaul charter rate: ₹14.50 / km for dedicated Light Commercial Vehicle
    const charterLinehaul = Math.round(distanceKm * 14.5);
    // Urgency surcharge for critical medical/priority freight
    const urgencyMultiplier = priorityLevel === 1 ? 0.35 : priorityLevel === 2 ? 0.15 : 0.0;
    const charterUrgencySurcharge = Math.round((baseCharterMobilization + charterLinehaul) * urgencyMultiplier);
    const dedicatedCharterCost = baseCharterMobilization + charterLinehaul + charterUrgencySurcharge;

    // 2. Piggyback Shared Capacity Model:
    // Terminal administrative handling fee: ₹250
    const piggybackHandlingFee = 250;
    // Marginal fuel surcharge: shared payload utilizes spare capacity, marginal cost proportional to cargo weight
    const weightTons = Math.max(0.05, cargoWeightKg / 1000);
    const marginalRatePerKm = Math.max(0.65, weightTons * 2.2);
    const piggybackMarginalFuel = Math.round(distanceKm * marginalRatePerKm);
    // Cross-dock transfer fee: ₹350 per interchange
    const piggybackTransferFee = transfers * 350;
    const piggybackCost = piggybackHandlingFee + piggybackMarginalFuel + piggybackTransferFee;

    const financialSavings = Math.max(0, dedicatedCharterCost - piggybackCost);
    const savingsPercent = Math.min(96, Math.max(10, Math.round((financialSavings / dedicatedCharterCost) * 100)));

    return {
      dedicatedCharterCost,
      piggybackCost,
      financialSavings,
      savingsPercent,
      breakdown: {
        baseCharterMobilization,
        charterLinehaul,
        charterUrgencySurcharge,
        piggybackHandlingFee,
        piggybackMarginalFuel,
        piggybackTransferFee,
      },
    };
  }
}

export class CarbonEmissionModel {
  /**
   * Computes carbon avoidance using GLEC/ISO 14083-inspired ton-km emissions model.
   * Diesel emission factor: 2.68 kg CO2 / Liter of Diesel.
   * Dedicated LCV emissions: ~0.28 - 0.32 kg CO2 / km.
   * Heavy linehaul truck marginal cargo emission: ~0.035 kg CO2 / ton-km.
   */
  public static calculateEmissions(params: {
    distanceKm: number;
    cargoWeightKg: number;
  }): EmissionBreakdown {
    const { distanceKm, cargoWeightKg } = params;
    const cargoTons = Math.max(0.05, cargoWeightKg / 1000);

    // Baseline charter dispatch: empty haul + return leg empty factor (1.4x deadhead return)
    const deadheadFactor = 1.35;
    const charterEmissionPerKm = 0.295; // kg CO2 / km for light commercial vehicle
    const charterEmissionsKg = Math.round(distanceKm * charterEmissionPerKm * deadheadFactor);

    // Marginal piggyback emissions: only additional fuel burned due to the extra mass
    const marginalEmissionFactorPerTonKm = 0.038; // kg CO2 / ton-km
    const marginalPiggybackEmissionsKg = Math.round(distanceKm * cargoTons * marginalEmissionFactorPerTonKm);

    // Net avoided carbon
    const co2SavedKg = Math.max(12, charterEmissionsKg - marginalPiggybackEmissionsKg);
    // Diesel fuel saved (2.68 kg CO2 / Liter)
    const fuelSavedLiters = Math.round(co2SavedKg / 2.68);
    // Empty miles averted
    const emptyMilesAvertedKm = Math.round(distanceKm * 0.95);

    return {
      co2SavedKg,
      fuelSavedLiters,
      emptyMilesAvertedKm,
      charterEmissionsKg,
      marginalPiggybackEmissionsKg,
      methodology: "GLEC/ISO 14083-inspired ton-km emissions model",
    };
  }
}
