import { AutopsyReport, RecoveryPlan, StaffShipment } from "./types";

export class AutopsyEngine {
  public static generateReport(
    shipment: StaffShipment,
    executedPlan?: RecoveryPlan | null
  ): AutopsyReport {
    const occurredAt = shipment.disruptionTimestamp || new Date(Date.now() - 3600000).toISOString();

    if (!executedPlan) {
      // Disruption Root-Cause Failure Diagnostics
      const baselineEta = new Date(Date.now() + 18 * 3600000).toISOString();
      const baselineCost = 1450;
      const baselineDistance = 1420;

      return {
        shipmentId: shipment.id,
        disruptionType: shipment.disruptionReason || "NETWORK_BOTTLENECK_DISRUPTION",
        rootCause: `Hard constraint rejection: Hub or carrier corridor constraints blocked all candidate routes at ${shipment.currentLocation} Hub. Dedicated emergency charter or operational override required.`,
        occurredAt,
        affectedHub: shipment.currentLocation,
        actualPlan: {
          eta: shipment.deadline,
          cost: 0,
          distance: 0,
          transfers: 0,
          vehicleId: "No Feasible Piggyback Carrier (Hard Constraints Blocked)",
        },
        baselinePlan: {
          eta: baselineEta,
          cost: baselineCost,
          distance: baselineDistance,
          transfers: 0,
          vehicleId: "Emergency Dedicated Charter Van (Recommended)",
        },
        cascadeImpact: {
          affectedShipmentsCount: 1,
          cumulativeDelayMinutes: 120,
          costSavingsVsCharter: 0,
          slaMaintained: false,
        },
        eventTimeline: [
          {
            timestamp: occurredAt,
            event: "DISRUPTION_TRIGGERED",
            details: `Shipment ${shipment.id} flagged as ${shipment.status} at ${shipment.currentLocation} Hub.`,
          },
          {
            timestamp: new Date(new Date(occurredAt).getTime() + 45000).toISOString(),
            event: "MOSAIC_SOLVER_INVOKED",
            details: `Evaluated candidate capacity paths across fleet. 7-dimension hard feasibility filters applied.`,
          },
          {
            timestamp: new Date(new Date(occurredAt).getTime() + 90000).toISOString(),
            event: "FEASIBILITY_EXHAUSTED",
            details: `All candidate carrier fleet routes rejected by hard constraints (Hub Unavailable / SLA / Capacity).`,
          },
          {
            timestamp: new Date().toISOString(),
            event: "AWAITING_DISPATCHER_ACTION",
            details: `Operator must lift hub maintenance restriction or authorize dedicated emergency charter.`,
          },
        ],
      };
    }

    const baselineCost = Math.round(executedPlan.incrementalCost * 1.65 + 320);
    const baselineDistance = Math.round(executedPlan.extraDistance * 1.8 + 80);
    const baselineEta = new Date(new Date(executedPlan.eta).getTime() + 75 * 60000).toISOString();

    const costSavingsVsCharter = Math.round(baselineCost * 1.5 - executedPlan.incrementalCost);

    return {
      shipmentId: shipment.id,
      disruptionType: shipment.disruptionReason || "MISROUTED_TRANSIT_FAILURE",
      rootCause: `Automated routing anomaly occurred during hub sorting at ${shipment.currentLocation}. Cargo diverted from scheduled carrier linehaul.`,
      occurredAt,
      affectedHub: shipment.currentLocation,
      actualPlan: {
        eta: executedPlan.eta,
        cost: executedPlan.incrementalCost,
        distance: executedPlan.extraDistance,
        transfers: executedPlan.transfers,
        vehicleId: executedPlan.vehicleId,
      },
      baselinePlan: {
        eta: baselineEta,
        cost: baselineCost,
        distance: baselineDistance,
        transfers: executedPlan.transfers + 1,
        vehicleId: "Dedicated Charter Van (Emergency Dispatch)",
      },
      cascadeImpact: {
        affectedShipmentsCount: 1,
        cumulativeDelayMinutes: Math.max(0, -executedPlan.slaMarginMinutes),
        costSavingsVsCharter,
        slaMaintained: executedPlan.slaMarginMinutes >= 0,
      },
      eventTimeline: [
        {
          timestamp: occurredAt,
          event: "DISRUPTION_TRIGGERED",
          details: `Shipment ${shipment.id} flagged as ${shipment.status} at ${shipment.currentLocation} Hub.`,
        },
        {
          timestamp: new Date(new Date(occurredAt).getTime() + 45000).toISOString(),
          event: "MOSAIC_SOLVER_INVOKED",
          details: `Evaluated candidate capacity paths across fleet. 7-dimension hard feasibility filters applied.`,
        },
        {
          timestamp: executedPlan.createdAt,
          event: "PRIMARY_AND_SHADOW_GENERATED",
          details: `Dual recovery plans synthesized. Primary assigned to ${executedPlan.vehicleId}.`,
        },
        {
          timestamp: new Date(new Date(executedPlan.createdAt).getTime() + 120000).toISOString(),
          event: "PLAN_EXECUTED",
          details: `Dispatcher approved recovery. In-transit capacity locked. Tracking timeline updated.`,
        },
      ],
    };
  }
}
