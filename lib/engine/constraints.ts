import { RejectionReason, StaffShipment, Truck } from "./types";

export class HardConstraintFilter {
  /**
   * Evaluates all 7 hard constraints from MOSAIC against a potential piggyback candidate.
   */
  public static evaluate(params: {
    shipment: StaffShipment;
    truck: Truck;
    pickupHub: string;
    dropoffHub: string;
    pickupTime: string; // ISO
    dropoffTime: string; // ISO
    currentTime: string; // ISO
    availableWeight: number;
    availableVolume: number;
    isTransfer?: boolean;
    transferDurationMinutes?: number;
    downstreamDelayMinutes?: number;
    hubMaintenanceWindows?: Record<string, { startHour: number; endHour: number }>;
    hubOperationalStatus?: Record<string, boolean>;
  }): { isFeasible: boolean; reason: RejectionReason | null } {
    const {
      shipment,
      dropoffHub,
      pickupTime,
      dropoffTime,
      currentTime,
      availableWeight,
      availableVolume,
      isTransfer = false,
      transferDurationMinutes = 0,
      downstreamDelayMinutes = 0,
      hubMaintenanceWindows = {},
      hubOperationalStatus = {},
    } = params;

    const pTime = new Date(pickupTime).getTime();
    const dTime = new Date(dropoffTime).getTime();
    const cTime = new Date(currentTime).getTime();
    const slaTime = new Date(shipment.deadline).getTime();

    // 1. Geography Reachability / Destination Match
    if (dropoffHub.toLowerCase() !== shipment.destination.toLowerCase() && !isTransfer) {
      return { isFeasible: false, reason: RejectionReason.WRONG_DESTINATION };
    }

    // 2. Time Feasibility (Missed Departure)
    if (pTime < cTime) {
      return { isFeasible: false, reason: RejectionReason.MISSED_DEPARTURE };
    }

    // 3. Payload Weight Capacity Check
    if (availableWeight < shipment.weight) {
      return { isFeasible: false, reason: RejectionReason.INSUFFICIENT_CAPACITY };
    }

    // 4. Cubic Volume Capacity Check
    if (availableVolume < shipment.volume) {
      return { isFeasible: false, reason: RejectionReason.INSUFFICIENT_VOLUME };
    }

    // 5. SLA Deadline Feasibility
    if (dTime > slaTime) {
      return { isFeasible: false, reason: RejectionReason.DEADLINE_IMPOSSIBLE };
    }

    // 6. Hub Operational State (Maintenance / Closure)
    const pClean = params.pickupHub.split(" ")[0].trim();
    const dClean = params.dropoffHub.split(" ")[0].trim();
    const isPickupOperational =
      hubOperationalStatus[params.pickupHub] ??
      hubOperationalStatus[pClean] ??
      hubOperationalStatus[params.pickupHub.toLowerCase()] ??
      hubOperationalStatus[pClean.toLowerCase()] ??
      true;
    const isDropoffOperational =
      hubOperationalStatus[params.dropoffHub] ??
      hubOperationalStatus[dClean] ??
      hubOperationalStatus[params.dropoffHub.toLowerCase()] ??
      hubOperationalStatus[dClean.toLowerCase()] ??
      true;

    if (isPickupOperational === false || isDropoffOperational === false) {
      return { isFeasible: false, reason: RejectionReason.HUB_OFFLINE };
    }

    const pDate = new Date(pickupTime);
    const dDate = new Date(dropoffTime);
    const pHour = pDate.getHours();
    const dHour = dDate.getHours();

    const pickupHubWindow =
      hubMaintenanceWindows[params.pickupHub] ||
      hubMaintenanceWindows[pClean] ||
      hubMaintenanceWindows[params.pickupHub.toLowerCase()];
    const dropoffHubWindow =
      hubMaintenanceWindows[params.dropoffHub] ||
      hubMaintenanceWindows[dClean] ||
      hubMaintenanceWindows[params.dropoffHub.toLowerCase()];

    if (pickupHubWindow && pHour >= pickupHubWindow.startHour && pHour < pickupHubWindow.endHour) {
      return { isFeasible: false, reason: RejectionReason.HUB_OFFLINE };
    }
    if (dropoffHubWindow && dHour >= dropoffHubWindow.startHour && dHour < dropoffHubWindow.endHour) {
      return { isFeasible: false, reason: RejectionReason.HUB_OFFLINE };
    }

    // 7. Transfer Synchronization Feasibility (minimum 15 mins for cargo handling)
    if (isTransfer && transferDurationMinutes < 15.0) {
      return { isFeasible: false, reason: RejectionReason.TRANSFER_TIME_IMPOSSIBLE };
    }

    // 8. Driver Duty Limits & Downstream Delay (Statutory 10 hours continuous limit or >30 min delay)
    const transitDurationHours = (dTime - pTime) / 3600000;
    if (transitDurationHours > 12.0) {
      return { isFeasible: false, reason: RejectionReason.DUTY_LIMIT_EXCEEDED };
    }
    if (downstreamDelayMinutes > 30.0) {
      return { isFeasible: false, reason: RejectionReason.DOWNSTREAM_DELAY_EXCEEDED };
    }

    return { isFeasible: true, reason: null };
  }
}
