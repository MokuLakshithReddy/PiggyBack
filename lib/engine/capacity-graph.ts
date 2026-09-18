import { Truck, RouteSegment } from "./types";

export type CapacityOpportunity = {
  truckId: string;
  segmentId: string;
  fromNode: string;
  toNode: string;
  arrivalTime: string;
  departureTime: string;
  availableWeight: number;
  availableVolume: number;
  distanceKm: number;
};

export class TemporalCapacityGraph {
  private trucks: Truck[];
  private currentTime: string;

  constructor(trucks: Truck[], currentTime: string = new Date().toISOString()) {
    this.trucks = trucks;
    this.currentTime = currentTime;
  }

  /**
   * Computes time-indexed free capacity at future hubs and segments for all trucks.
   */
  public build(): Record<string, CapacityOpportunity[]> {
    const graph: Record<string, CapacityOpportunity[]> = {};
    const currMs = new Date(this.currentTime).getTime();

    for (const truck of this.trucks) {
      const ops: CapacityOpportunity[] = [];
      const segments: RouteSegment[] = truck.schedule || [];

      for (const segment of segments) {
        const arrMs = new Date(segment.arrivalTime).getTime();
        const depMs = new Date(segment.departureTime).getTime();

        // Include active or upcoming segments
        if (arrMs >= currMs || depMs >= currMs) {
          ops.push({
            truckId: truck.id,
            segmentId: segment.segmentId,
            fromNode: segment.fromNode,
            toNode: segment.toNode,
            arrivalTime: segment.arrivalTime,
            departureTime: segment.departureTime,
            availableWeight: truck.availableCapacity,
            availableVolume: truck.availableVolume ?? 15,
            distanceKm: segment.distanceKm || 120,
          });
        }
      }
      graph[truck.id] = ops;
    }

    return graph;
  }
}
