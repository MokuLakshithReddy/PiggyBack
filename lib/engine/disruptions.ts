import { DisruptionPayload, Hub, StaffShipment, Truck } from "./types";

export type DisruptionResult = {
  success: boolean;
  message: string;
  affectedShipmentIds: string[];
  affectedVehicleIds: string[];
  affectedHubIds: string[];
  stateVersion: number;
};

export class DisruptionEngine {
  /**
   * Injects an operational disruption into the digital twin network.
   */
  public static inject(
    payload: DisruptionPayload,
    data: {
      shipments: StaffShipment[];
      trucks: Truck[];
      hubs: Hub[];
      stateVersion: number;
    }
  ): {
    updatedShipments: StaffShipment[];
    updatedTrucks: Truck[];
    updatedHubs: Hub[];
    result: DisruptionResult;
  } {
    const { disruptionType } = payload;
    let shipments = [...data.shipments];
    let trucks = [...data.trucks];
    let hubs = [...data.hubs];
    const newVersion = data.stateVersion + 1;

    const affectedShipmentIds: string[] = [];
    const affectedVehicleIds: string[] = [];
    const affectedHubIds: string[] = [];
    let message = "";

    switch (disruptionType) {
      case "misroute_shipment": {
        const targetShipmentId = payload.shipmentId || "SHP-2048";
        const divertedHub = payload.targetHub || "Nagpur";

        shipments = shipments.map((s) => {
          if (s.id === targetShipmentId) {
            affectedShipmentIds.push(s.id);
            return {
              ...s,
              status: "Misplaced" as const,
              currentLocation: divertedHub,
              disruptionReason: payload.reason || `Misrouted cargo diverted to ${divertedHub} Hub`,
              disruptionTimestamp: new Date().toISOString(),
              assignedTruck: null,
            };
          }
          return s;
        });

        message = `Shipment ${targetShipmentId} misrouted to ${divertedHub}. Triggered MOSAIC recovery protocol.`;
        break;
      }

      case "delay_vehicle": {
        const targetTruckId = payload.vehicleId || trucks[0]?.id || "TRK-001";
        const delay = payload.delayMinutes || 45;

        trucks = trucks.map((t) => {
          if (t.id === targetTruckId) {
            affectedVehicleIds.push(t.id);
            const updatedSchedule = t.schedule.map((seg) => ({
              ...seg,
              arrivalTime: new Date(new Date(seg.arrivalTime).getTime() + delay * 60000).toISOString(),
              departureTime: new Date(new Date(seg.departureTime).getTime() + delay * 60000).toISOString(),
            }));
            return {
              ...t,
              status: "Delayed" as const,
              currentDelayMinutes: (t.currentDelayMinutes || 0) + delay,
              schedule: updatedSchedule,
            };
          }
          return t;
        });

        // Flag any shipments on that truck
        shipments = shipments.map((s) => {
          if (s.assignedTruck === targetTruckId) {
            affectedShipmentIds.push(s.id);
            return {
              ...s,
              status: "Delayed" as const,
              disruptionReason: `Carrier truck ${targetTruckId} delayed by +${delay} mins`,
              disruptionTimestamp: new Date().toISOString(),
            };
          }
          return s;
        });

        // If no shipment was assigned, correlate to an active corridor shipment
        if (affectedShipmentIds.length === 0) {
          const targetTruck = trucks.find((t) => t.id === targetTruckId);
          if (targetTruck) {
            const corridorShipment = shipments.find(
              (s) =>
                s.status !== "Delivered" &&
                s.status !== "Recovered" &&
                (s.currentLocation.toLowerCase() === targetTruck.currentLocation.toLowerCase() ||
                 s.destination.toLowerCase() === targetTruck.destination.toLowerCase())
            );
            if (corridorShipment) {
              affectedShipmentIds.push(corridorShipment.id);
            }
          }
        }

        message = `Vehicle ${targetTruckId} delayed by ${delay} mins. Affected ${affectedShipmentIds.length} onboard/corridor shipments.`;
        break;
      }

      case "close_hub": {
        const targetHubId = payload.hubId || "HUB-HYD";
        const hub = hubs.find((h) => h.id === targetHubId || h.name.toLowerCase() === targetHubId.toLowerCase());
        const hubName = hub ? hub.name : targetHubId;

        // Check current operational status and toggle
        const isCurrentlyOperational = hub ? hub.isOperational : true;
        const newOperationalStatus = !isCurrentlyOperational;

        hubs = hubs.map((h) => {
          if (h.id === targetHubId || h.name.toLowerCase() === targetHubId.toLowerCase()) {
            affectedHubIds.push(h.id);
            return { ...h, isOperational: newOperationalStatus };
          }
          return h;
        });

        if (!newOperationalStatus) {
          // Terminal closed
          shipments = shipments.map((s) => {
            if (s.currentLocation.toLowerCase() === hubName.toLowerCase() || s.destination.toLowerCase() === hubName.toLowerCase()) {
              affectedShipmentIds.push(s.id);
              return {
                ...s,
                status: "Delayed" as const,
                disruptionReason: `Operational closure at ${hubName} Hub due to weather/maintenance`,
                disruptionTimestamp: new Date().toISOString(),
              };
            }
            return s;
          });
          message = `Hub ${hubName} emergency closure enforced. Terminal marked OFFLINE.`;
        } else {
          // Terminal restored / reopened
          shipments = shipments.map((s) => {
            if (s.currentLocation.toLowerCase() === hubName.toLowerCase() || s.destination.toLowerCase() === hubName.toLowerCase()) {
              affectedShipmentIds.push(s.id);
              return {
                ...s,
                status: "Pending" as const,
                disruptionReason: `Terminal operations restored at ${hubName} Hub. Re-synthesis initiated.`,
                disruptionTimestamp: new Date().toISOString(),
              };
            }
            return s;
          });
          message = `Hub ${hubName} reopened. Terminal status restored to ONLINE.`;
        }
        break;
      }

      case "reduce_capacity": {
        const targetTruckId = payload.vehicleId || trucks[0]?.id || "TRK-001";
        const reductionPct = payload.capacityReductionPercent || 50;
        const factor = (100 - reductionPct) / 100;

        trucks = trucks.map((t) => {
          if (t.id === targetTruckId) {
            affectedVehicleIds.push(t.id);
            const newCap = Math.round(t.capacity * factor);
            const newAvailCap = Math.round(t.availableCapacity * factor);
            const newMaxVol = Math.round((t.maxVolume ?? 40) * factor * 10) / 10;
            const newAvailVol = Math.round((t.availableVolume ?? 15) * factor * 10) / 10;
            return {
              ...t,
              capacity: newCap,
              availableCapacity: newAvailCap,
              maxVolume: newMaxVol,
              availableVolume: newAvailVol,
            };
          }
          return t;
        });

        // Correlate shipments assigned to or relying on this truck
        shipments = shipments.map((s) => {
          if (s.assignedTruck === targetTruckId) {
            affectedShipmentIds.push(s.id);
            return {
              ...s,
              status: "Delayed" as const,
              disruptionReason: `Carrier ${targetTruckId} payload capacity throttled by -${reductionPct}%`,
              disruptionTimestamp: new Date().toISOString(),
            };
          }
          return s;
        });

        // If no shipment was assigned, correlate to a heavy shipment on that route
        if (affectedShipmentIds.length === 0) {
          const targetTruck = trucks.find((t) => t.id === targetTruckId);
          if (targetTruck) {
            const heavyShipment = shipments.find(
              (s) =>
                s.status !== "Delivered" &&
                s.status !== "Recovered" &&
                (s.currentLocation.toLowerCase() === targetTruck.currentLocation.toLowerCase() ||
                 s.destination.toLowerCase() === targetTruck.destination.toLowerCase())
            );
            if (heavyShipment) {
              affectedShipmentIds.push(heavyShipment.id);
            }
          }
        }

        message = `Vehicle ${targetTruckId} weight & volume capacity throttled by -${reductionPct}%. Correlated ${affectedShipmentIds.length} candidate shipments.`;
        break;
      }
    }

    return {
      updatedShipments: shipments,
      updatedTrucks: trucks,
      updatedHubs: hubs,
      result: {
        success: true,
        message,
        affectedShipmentIds,
        affectedVehicleIds,
        affectedHubIds,
        stateVersion: newVersion,
      },
    };
  }
}
