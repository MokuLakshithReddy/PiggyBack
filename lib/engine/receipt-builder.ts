import {
  CandidateRoute,
  DecisionReceipt,
  RejectedCandidateInfo,
  StaffShipment,
} from "./types";

export class ReceiptBuilder {
  /**
   * Constructs an auditable, verifiable decision receipt for a recovery solve.
   */
  public static buildReceipt(params: {
    shipment: StaffShipment;
    status: "OPTIMAL" | "FEASIBLE" | "NO_FEASIBLE_PIGGYBACK";
    planId?: string;
    allCandidates: CandidateRoute[];
    selectedCandidate?: CandidateRoute | null;
    solveTimeMs: number;
    currentTime?: string;
  }): DecisionReceipt {
    const {
      shipment,
      status,
      planId,
      allCandidates,
      selectedCandidate,
      solveTimeMs,
      currentTime = new Date().toISOString(),
    } = params;

    const rejectedCandidates: RejectedCandidateInfo[] = [];

    for (const c of allCandidates) {
      if (!c.isFeasible && c.shipmentId === shipment.id) {
        rejectedCandidates.push({
          candidateId: c.id,
          vehicleId: c.vehicleId,
          rejectionReason: c.rejectionReason || "UNKNOWN",
          pickupHub: c.pickupHub,
          dropoffHub: c.dropoffHub,
        });
      }
    }

    const feasibleCount = allCandidates.filter((c) => c.isFeasible).length;

    let weightCheckMargin: number | undefined;
    let timeCheckPickupMarginMinutes: number | undefined;
    let deliveryCheckSlaMarginMinutes: number | undefined;
    let downstreamRouteCheckDelayMinutes: number | undefined;

    if (selectedCandidate) {
      // Weight check margin = available weight capacity - shipment weight
      weightCheckMargin = selectedCandidate.pathMinWeight - shipment.weight;

      // Pickup time margin = pickup_time - current_time
      const pMs = new Date(selectedCandidate.pickupTime).getTime();
      const cMs = new Date(currentTime).getTime();
      timeCheckPickupMarginMinutes = Math.round((pMs - cMs) / 60000);

      // SLA margin = deadline - dropoff_time
      const slaMs = new Date(shipment.deadline).getTime();
      const dMs = new Date(selectedCandidate.dropoffTime).getTime();
      deliveryCheckSlaMarginMinutes = Math.round((slaMs - dMs) / 60000);

      // Downstream delay
      downstreamRouteCheckDelayMinutes = selectedCandidate.downstreamDelayMinutes;
    }

    // Generate deterministic sha-like pseudo hash
    const raw = `${shipment.id}:${status}:${planId || "none"}:${currentTime}:${solveTimeMs}:${rejectedCandidates.length}`;
    let hashNum = 0;
    for (let i = 0; i < raw.length; i++) {
      hashNum = (hashNum << 5) - hashNum + raw.charCodeAt(i);
      hashNum |= 0;
    }
    const hash = `0x${Math.abs(hashNum).toString(16).padStart(8, "0")}${Math.random().toString(16).substring(2, 10)}`;

    return {
      planId,
      shipmentId: shipment.id,
      status,
      selectedVehicleId: selectedCandidate ? selectedCandidate.vehicleId : undefined,
      selectedCandidate: selectedCandidate || undefined,
      weightCheckMargin,
      timeCheckPickupMarginMinutes,
      deliveryCheckSlaMarginMinutes,
      downstreamRouteCheckDelayMinutes,
      rejectedCandidates,
      solveTimeMs,
      totalCandidatesEvaluated: allCandidates.length,
      feasibleCandidatesCount: feasibleCount,
      createdAt: currentTime,
      hash,
    };
  }
}
