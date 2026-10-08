import { CandidateRoute, StaffShipment, Truck } from "./types";
import { TemporalCapacityGraph } from "./capacity-graph";
import { HardConstraintFilter } from "./constraints";
import { PAN_INDIA_HUB_COORDS } from "./road-routes";

export function getHubRoadDistanceKm(hub1: string, hub2: string): number {
  const c1 = PAN_INDIA_HUB_COORDS[hub1.toUpperCase()] || PAN_INDIA_HUB_COORDS[hub1.substring(0, 3).toUpperCase()];
  const c2 = PAN_INDIA_HUB_COORDS[hub2.toUpperCase()] || PAN_INDIA_HUB_COORDS[hub2.substring(0, 3).toUpperCase()];
  if (!c1 || !c2) return 400; // sensible default
  const R = 6371;
  const dLat = ((c2[0] - c1[0]) * Math.PI) / 180;
  const dLon = ((c2[1] - c1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1[0] * Math.PI) / 180) *
      Math.cos((c2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1.25); // Indian National Highway circuity factor
}

export class CandidateGenerator {
  private trucks: Truck[];
  private currentTime: string;
  private hubMaintenanceWindows: Record<string, { startHour: number; endHour: number }>;
  private hubOperationalStatus: Record<string, boolean>;

  constructor(
    trucks: Truck[],
    currentTime: string = new Date().toISOString(),
    hubMaintenanceWindows: Record<string, { startHour: number; endHour: number }> = {},
    hubOperationalStatus: Record<string, boolean> = {}
  ) {
    this.trucks = trucks;
    this.currentTime = currentTime;
    this.hubMaintenanceWindows = hubMaintenanceWindows;
    this.hubOperationalStatus = hubOperationalStatus;
  }

  /**
   * Explores all candidate piggyback opportunities for a given shipment,
   * checking direct legs and transfers across available trucks, and runs
   * the 7-dimension hard constraint filter on each.
   */
  public generateCandidates(shipment: StaffShipment): CandidateRoute[] {
    const capacityGraph = new TemporalCapacityGraph(this.trucks, this.currentTime).build();
    const candidates: CandidateRoute[] = [];
    const pickupLoc = shipment.currentLocation.toLowerCase();
    const destLoc = shipment.destination.toLowerCase();

    // 1. Direct segments on individual trucks
    for (const truck of this.trucks) {
      const ops = capacityGraph[truck.id] || [];

      for (let i = 0; i < ops.length; i++) {
        const startOp = ops[i];

        // Check for pickup at current location or matching start
        if (startOp.fromNode.toLowerCase() === pickupLoc) {
          // Look down the schedule for the destination
          for (let j = i; j < ops.length; j++) {
            const endOp = ops[j];

            if (endOp.toNode.toLowerCase() === destLoc) {
              const distance = ops.slice(i, j + 1).reduce((sum, o) => sum + o.distanceKm, 0);
              const minWeight = Math.min(...ops.slice(i, j + 1).map((o) => o.availableWeight));
              const minVolume = Math.min(...ops.slice(i, j + 1).map((o) => o.availableVolume));

              const pickupTime = startOp.departureTime;
              const dropoffTime = endOp.arrivalTime;

              const arrivalMs = new Date(dropoffTime).getTime();
              const deadlineMs = new Date(shipment.deadline).getTime();
              const delayMinutes = Math.max(0, (arrivalMs - deadlineMs) / 60000);
              const incrementalCost = Math.round(distance * 1.85 + (delayMinutes > 0 ? delayMinutes * 0.5 : 0));
              const downstreamDelay = truck.currentDelayMinutes || 0;

              const { isFeasible, reason } = HardConstraintFilter.evaluate({
                shipment,
                truck,
                pickupHub: startOp.fromNode,
                dropoffHub: endOp.toNode,
                pickupTime,
                dropoffTime,
                currentTime: this.currentTime,
                availableWeight: minWeight,
                availableVolume: minVolume,
                isTransfer: false,
                downstreamDelayMinutes: downstreamDelay,
                hubMaintenanceWindows: this.hubMaintenanceWindows,
                hubOperationalStatus: this.hubOperationalStatus,
              });

              candidates.push({
                id: `CAND-${truck.id}-${startOp.fromNode}-${endOp.toNode}-${i}`,
                shipmentId: shipment.id,
                vehicleId: truck.id,
                pickupHub: startOp.fromNode,
                dropoffHub: endOp.toNode,
                pickupTime,
                dropoffTime,
                pathMinWeight: minWeight,
                pathMinVolume: minVolume,
                isTransfer: false,
                transfers: 0,
                downstreamDelayMinutes: downstreamDelay,
                delayMinutes,
                incrementalCost,
                distance,
                isFeasible,
                rejectionReason: reason,
              });
            }
          }
        }
      }
    }

    // 2. Detour / Nearby hub candidate generation (if truck stops at or passes near the corridor)
    for (const truck of this.trucks) {
      // Check if truck's destination matches shipment's destination, but truck originates elsewhere
      const isCorridorMatch =
        truck.destination.toLowerCase() === destLoc &&
        truck.currentLocation.toLowerCase() !== pickupLoc &&
        candidates.every((c) => c.vehicleId !== truck.id) &&
        (truck.schedule.some((s) => s.fromNode.toLowerCase() === pickupLoc || s.toNode.toLowerCase() === pickupLoc) ||
          (truck.currentLocation.toLowerCase() === "pune" && pickupLoc === "mumbai") ||
          (truck.currentLocation.toLowerCase() === "mumbai" && pickupLoc === "pune") ||
          (truck.currentLocation.toLowerCase() === "bengaluru" && pickupLoc === "chennai") ||
          (truck.currentLocation.toLowerCase() === "chennai" && pickupLoc === "bengaluru") ||
          (truck.currentLocation.toLowerCase() === "hyderabad" && pickupLoc === "nagpur") ||
          (truck.currentLocation.toLowerCase() === "nagpur" && pickupLoc === "hyderabad") ||
          (truck.currentLocation.toLowerCase() === "mumbai" && pickupLoc === "ahmedabad") ||
          (truck.currentLocation.toLowerCase() === "ahmedabad" && pickupLoc === "mumbai") ||
          (truck.currentLocation.toLowerCase() === "delhi" && pickupLoc === "chandigarh") ||
          (truck.currentLocation.toLowerCase() === "chandigarh" && pickupLoc === "delhi") ||
          (truck.currentLocation.toLowerCase() === "delhi" && pickupLoc === "jaipur") ||
          (truck.currentLocation.toLowerCase() === "jaipur" && pickupLoc === "delhi") ||
          (truck.currentLocation.toLowerCase() === "lucknow" && pickupLoc === "patna") ||
          (truck.currentLocation.toLowerCase() === "patna" && pickupLoc === "lucknow") ||
          (truck.currentLocation.toLowerCase() === "bhopal" && pickupLoc === "indore") ||
          (truck.currentLocation.toLowerCase() === "indore" && pickupLoc === "bhopal") ||
          (truck.currentLocation.toLowerCase() === "coimbatore" && pickupLoc === "kochi") ||
          (truck.currentLocation.toLowerCase() === "kochi" && pickupLoc === "coimbatore") ||
          (truck.currentLocation.toLowerCase() === "visakhapatnam" && pickupLoc === "bhubaneswar") ||
          (truck.currentLocation.toLowerCase() === "bhubaneswar" && pickupLoc === "visakhapatnam"));

      if (isCorridorMatch) {
        const baseDistance = getHubRoadDistanceKm(shipment.currentLocation, shipment.destination);
        const detourKm = Math.max(25, Math.round(baseDistance * 0.12));
        const totalDist = baseDistance + detourKm;
        const pickupMs = new Date(this.currentTime).getTime() + 45 * 60000;
        const dropoffMs = pickupMs + Math.round((totalDist / 60) * 3600000);

        const pickupTime = new Date(pickupMs).toISOString();
        const dropoffTime = new Date(dropoffMs).toISOString();
        const deadlineMs = new Date(shipment.deadline).getTime();
        const delayMinutes = Math.max(0, (dropoffMs - deadlineMs) / 60000);
        const incrementalCost = Math.round(totalDist * 2.1);
        const downstreamDelay = 22; // 22 mins detour delay to downstream schedule

        const { isFeasible, reason } = HardConstraintFilter.evaluate({
          shipment,
          truck,
          pickupHub: shipment.currentLocation,
          dropoffHub: shipment.destination,
          pickupTime,
          dropoffTime,
          currentTime: this.currentTime,
          availableWeight: truck.availableCapacity,
          availableVolume: truck.availableVolume ?? 12,
          isTransfer: false,
          downstreamDelayMinutes: downstreamDelay,
          hubMaintenanceWindows: this.hubMaintenanceWindows,
          hubOperationalStatus: this.hubOperationalStatus,
        });

        candidates.push({
          id: `CAND-DETOUR-${truck.id}-${shipment.currentLocation}-${shipment.destination}`,
          shipmentId: shipment.id,
          vehicleId: truck.id,
          pickupHub: shipment.currentLocation,
          dropoffHub: shipment.destination,
          pickupTime,
          dropoffTime,
          pathMinWeight: truck.availableCapacity,
          pathMinVolume: truck.availableVolume ?? 12,
          isTransfer: false,
          transfers: 0,
          downstreamDelayMinutes: downstreamDelay,
          delayMinutes,
          incrementalCost,
          distance: totalDist,
          isFeasible,
          rejectionReason: reason,
        });
      }
    }

    // 3. Multi-hop transfer candidate generation (Leg 1 to intermediate hub -> Leg 2 to destination)
    // Identify intermediate hubs that connect both
    const intermediateHubs = [
      "Bengaluru",
      "Chennai",
      "Pune",
      "Nagpur",
      "Hyderabad",
      "Delhi",
      "Mumbai",
      "Kolkata",
      "Ahmedabad",
      "Jaipur",
      "Lucknow",
      "Patna",
      "Bhubaneswar",
      "Visakhapatnam",
      "Indore",
      "Bhopal",
      "Coimbatore",
    ];
    for (const interHub of intermediateHubs) {
      if (interHub.toLowerCase() === pickupLoc || interHub.toLowerCase() === destLoc) continue;

      const leg1Trucks = this.trucks.filter(
        (t) =>
          (t.currentLocation.toLowerCase() === pickupLoc || t.schedule.some((s) => s.fromNode.toLowerCase() === pickupLoc)) &&
          (t.destination.toLowerCase() === interHub.toLowerCase() || t.schedule.some((s) => s.toNode.toLowerCase() === interHub.toLowerCase()))
      );

      const leg2Trucks = this.trucks.filter(
        (t) =>
          (t.currentLocation.toLowerCase() === interHub.toLowerCase() || t.schedule.some((s) => s.fromNode.toLowerCase() === interHub.toLowerCase())) &&
          (t.destination.toLowerCase() === destLoc || t.schedule.some((s) => s.toNode.toLowerCase() === destLoc))
      );

      if (leg1Trucks.length > 0 && leg2Trucks.length > 0) {
        for (let i1 = 0; i1 < Math.min(2, leg1Trucks.length); i1++) {
          for (let i2 = 0; i2 < Math.min(2, leg2Trucks.length); i2++) {
            const t1 = leg1Trucks[i1];
            const t2 = leg2Trucks[i2];
            if (t1.id === t2.id) continue;

            const pMs = new Date(this.currentTime).getTime() + 30 * 60000;
            const d1 = getHubRoadDistanceKm(shipment.currentLocation, interHub);
            const d2 = getHubRoadDistanceKm(interHub, shipment.destination);
            const dist = d1 + d2;
            const leg1Hours = Math.max(1.5, d1 / 65);
            const leg2Hours = Math.max(1.5, d2 / 65);

            const transferArrivalMs = pMs + Math.round(leg1Hours * 3600000);
            const transferDepartureMs = transferArrivalMs + 45 * 60000; // 45 min transfer window
            const dropoffMs = transferDepartureMs + Math.round(leg2Hours * 3600000);

            const pickupTime = new Date(pMs).toISOString();
            const dropoffTime = new Date(dropoffMs).toISOString();
            const minWeight = Math.min(t1.availableCapacity, t2.availableCapacity);
            const minVol = Math.min(t1.availableVolume ?? 12, t2.availableVolume ?? 12);
            const deadlineMs = new Date(shipment.deadline).getTime();
            const delayMinutes = Math.max(0, (dropoffMs - deadlineMs) / 60000);
            const incrementalCost = Math.round(dist * 2.4);

            const { isFeasible, reason } = HardConstraintFilter.evaluate({
              shipment,
              truck: t1,
              pickupHub: shipment.currentLocation,
              dropoffHub: shipment.destination,
              pickupTime,
              dropoffTime,
              currentTime: this.currentTime,
              availableWeight: minWeight,
              availableVolume: minVol,
              isTransfer: true,
              transferDurationMinutes: 45,
              downstreamDelayMinutes: 15,
              hubMaintenanceWindows: this.hubMaintenanceWindows,
              hubOperationalStatus: this.hubOperationalStatus,
            });

            candidates.push({
              id: `CAND-TRANSFER-${t1.id}-${t2.id}-${interHub}`,
              shipmentId: shipment.id,
              vehicleId: `${t1.id} + ${t2.id}`,
              pickupHub: shipment.currentLocation,
              dropoffHub: shipment.destination,
              pickupTime,
              dropoffTime,
              pathMinWeight: minWeight,
              pathMinVolume: minVol,
              isTransfer: true,
              transfers: 1,
              transferHub: interHub,
              downstreamDelayMinutes: 15,
              delayMinutes,
              incrementalCost,
              distance: dist,
              isFeasible,
              rejectionReason: reason,
            });
          }
        }
      }
    }

    return candidates;
  }
}
