import { Graph } from "./graph";
import { GraphEdge, GraphNode } from "./types";
import { getFreshSeedData } from "../../lib/engine/seed";

/**
 * Adapter that instantiates a Graph from the Pan-India 20 Hubs & Scheduled Logistics network.
 */
export function buildPanIndiaLogisticsGraph(): Graph {
  const graph = new Graph();
  const seed = getFreshSeedData();

  // Add all 20 hubs as Graph Nodes
  for (const hub of seed.hubs) {
    const node: GraphNode = {
      id: hub.name, // Use city name or ID as key
      name: hub.name,
      coords: { lat: hub.lat, lng: hub.lon },
      type: "HUB",
      capacity: 50000, // 50 tons hub capacity
      metadata: { hubId: hub.id, code: hub.code, state: hub.state },
    };
    graph.addNode(node);
  }

  // Build edges from truck schedules and direct interstate highway links
  let edgeCounter = 1;
  const edgeDedupe = new Set<string>();

  for (const truck of seed.trucks) {
    for (const segment of truck.schedule) {
      const src = segment.fromNode;
      const tgt = segment.toNode;
      if (!graph.hasNode(src) || !graph.hasNode(tgt)) continue;

      const dedupeKey = `${src}->${tgt}`;
      if (!edgeDedupe.has(dedupeKey)) {
        edgeDedupe.add(dedupeKey);

        const dep = new Date(segment.departureTime).getTime();
        const arr = new Date(segment.arrivalTime).getTime();
        const durationMinutes = Math.max(30, Math.round((arr - dep) / 60000));

        // Derive risk score based on corridor characteristics
        const risk = segment.distanceKm > 1000 ? 0.35 : segment.distanceKm > 500 ? 0.20 : 0.08;

        const edge: GraphEdge = {
          id: `CORRIDOR-${edgeCounter++}`,
          source: src,
          target: tgt,
          distanceKm: segment.distanceKm,
          travelTimeMin: durationMinutes,
          riskScore: risk,
          capacityKg: truck.capacity,
          currentLoadKg: truck.capacity - truck.availableCapacity,
          cost: Math.round(segment.distanceKm * 2.8),
          status: "ACTIVE",
          bidirectional: true,
          metadata: {
            truckId: truck.id,
            driver: truck.driverName,
          },
        };

        graph.addEdge(edge);
      }
    }
  }

  // Ensure major national highway corridors connect neighboring hubs even if no truck is currently seeded
  const nationalHighwayCorridors = [
    { from: "Delhi", to: "Jaipur", dist: 280, time: 270, risk: 0.12 },
    { from: "Delhi", to: "Chandigarh", dist: 250, time: 240, risk: 0.10 },
    { from: "Delhi", to: "Lucknow", dist: 530, time: 480, risk: 0.15 },
    { from: "Jaipur", to: "Ahmedabad", dist: 660, time: 600, risk: 0.18 },
    { from: "Ahmedabad", to: "Mumbai", dist: 530, time: 510, risk: 0.14 },
    { from: "Mumbai", to: "Pune", dist: 150, time: 180, risk: 0.08 },
    { from: "Pune", to: "Bengaluru", dist: 840, time: 780, risk: 0.22 },
    { from: "Bengaluru", to: "Chennai", dist: 350, time: 330, risk: 0.11 },
    { from: "Bengaluru", to: "Coimbatore", dist: 360, time: 360, risk: 0.12 },
    { from: "Coimbatore", to: "Kochi", dist: 190, time: 240, risk: 0.14 },
    { from: "Chennai", to: "Visakhapatnam", dist: 800, time: 780, risk: 0.25 },
    { from: "Visakhapatnam", to: "Bhubaneswar", dist: 440, time: 420, risk: 0.18 },
    { from: "Bhubaneswar", to: "Kolkata", dist: 440, time: 450, risk: 0.20 },
    { from: "Kolkata", to: "Patna", dist: 580, time: 600, risk: 0.22 },
    { from: "Patna", to: "Lucknow", dist: 540, time: 520, risk: 0.19 },
    { from: "Delhi", to: "Bhopal", dist: 780, time: 720, risk: 0.24 },
    { from: "Bhopal", to: "Nagpur", dist: 350, time: 360, risk: 0.15 },
    { from: "Nagpur", to: "Hyderabad", dist: 500, time: 480, risk: 0.16 },
    { from: "Hyderabad", to: "Bengaluru", dist: 570, time: 540, risk: 0.15 },
    { from: "Hyderabad", to: "Chennai", dist: 630, time: 600, risk: 0.17 },
    { from: "Indore", to: "Bhopal", dist: 190, time: 200, risk: 0.09 },
    { from: "Indore", to: "Ahmedabad", dist: 390, time: 410, risk: 0.14 },
    { from: "Nagpur", to: "Mumbai", dist: 810, time: 780, risk: 0.21 },
    { from: "Kolkata", to: "Guwahati", dist: 990, time: 1080, risk: 0.38 },
  ];

  for (const c of nationalHighwayCorridors) {
    if (graph.hasNode(c.from) && graph.hasNode(c.to) && !graph.getEdgeBetween(c.from, c.to)) {
      graph.addEdge({
        id: `NH-CORR-${edgeCounter++}`,
        source: c.from,
        target: c.to,
        distanceKm: c.dist,
        travelTimeMin: c.time,
        riskScore: c.risk,
        capacityKg: 5000,
        currentLoadKg: 1000,
        cost: Math.round(c.dist * 3.2),
        status: "ACTIVE",
        bidirectional: true,
      });
    }
  }

  return graph;
}
