import { Graph } from "../graph/graph";
import { PiggyBackOptimizer } from "../optimizer/optimizer";
import { DynamicReplanner } from "../replanning/replanner";
import { PlanContext } from "../constraints/types";
import {
  SimulationAgent,
  SimulationDisruption,
  SimulationScenarioConfig,
  SimulationTickLog,
} from "./types";

export interface SimulationResult {
  scenarioName: string;
  totalDurationMin: number;
  totalAgents: number;
  deliveredCount: number;
  slaBreachCount: number;
  replanningEventsCount: number;
  shadowFailoversCount: number;
  incrementalRepairsCount: number;
  tickLogs: SimulationTickLog[];
  agentSummaries: {
    agentId: string;
    status: string;
    totalTravelTimeMin: number;
    slaDeadlineMin: number;
    metSLA: boolean;
    routeHistory: string[];
    replanningsCount: number;
  }[];
}

/**
 * Discrete-Event Logistics & Evacuation Simulation Engine
 * Simulates real-time spatial movement, dynamic disruptions, and autonomous replanning.
 */
export class SimulationEngine {
  private graph: Graph;
  private optimizer: PiggyBackOptimizer;
  private replanner: DynamicReplanner;

  constructor(graph: Graph) {
    this.graph = graph;
    this.optimizer = new PiggyBackOptimizer(graph);
    this.replanner = new DynamicReplanner(graph, this.optimizer);
  }

  public runScenario(config: SimulationScenarioConfig): SimulationResult {
    const timeStep = config.timeStepMin ?? 30; // 30-minute ticks
    const maxTime = config.maxSimulationTimeMin ?? 3000; // max minutes
    let currentTimeMin = 0;

    const tickLogs: SimulationTickLog[] = [];
    let shadowFailovers = 0;
    let incrementalRepairs = 0;
    let totalReplannings = 0;

    // 1. Initialize agents and initial plans
    const agents: SimulationAgent[] = [];

    for (const a of config.agents) {
      const context: PlanContext = {
        cargoWeightKg: a.cargoWeightKg,
        priorityLevel: a.priorityLevel,
        slaDeadlineMinutes: a.slaDeadlineMinutes,
      };

      const solveRes = this.optimizer.solve(a.source, a.destination, context, {
        profile: "BALANCED",
        enableShadowPlan: true,
      });

      if (!solveRes.primaryPlan) {
        throw new Error(`Cannot initialize agent ${a.id}: no feasible initial route from ${a.source} to ${a.destination}`);
      }

      agents.push({
        id: a.id,
        cargoWeightKg: a.cargoWeightKg,
        priorityLevel: a.priorityLevel,
        source: a.source,
        destination: a.destination,
        slaDeadlineMinutes: a.slaDeadlineMinutes,
        currentLocationNode: a.source,
        currentEdgeProgressPct: 0,
        currentEdgeIndex: 0,
        activePlan: solveRes.primaryPlan,
        shadowPlan: solveRes.shadowPlan,
        status: "EN_ROUTE",
        history: [{ timeMin: 0, location: a.source, action: "Departed Origin" }],
      });
    }

    // Pending disruptions sorted by trigger time
    const pendingDisruptions = [...config.scheduledDisruptions].sort(
      (a, b) => a.triggerTimeMin - b.triggerTimeMin
    );
    const activeDisruptions: SimulationDisruption[] = [];

    // 2. Simulation Loop (t = 0 -> maxTime)
    while (currentTimeMin <= maxTime) {
      const tickEvents: string[] = [];
      let tickReplannings = 0;

      // Check for disruptions scheduled at or before this tick
      while (pendingDisruptions.length > 0 && pendingDisruptions[0].triggerTimeMin <= currentTimeMin) {
        const disruption = pendingDisruptions.shift()!;
        activeDisruptions.push(disruption);
        tickEvents.push(`[T=${currentTimeMin}m] DISRUPTION INJECTED: ${disruption.description}`);

        // Apply physical disruption to the graph
        if (disruption.type === "ROAD_BLOCKED" && disruption.edgeId) {
          this.graph.setEdgeStatus(disruption.edgeId, "BLOCKED");
        } else if (disruption.type === "ROAD_CONGESTED" && disruption.edgeId) {
          this.graph.setEdgeStatus(disruption.edgeId, "CONGESTED");
          const edge = this.graph.getEdge(disruption.edgeId);
          if (edge) {
            edge.travelTimeMin *= disruption.severity ?? 1.8;
            edge.riskScore = Math.min(1.0, edge.riskScore + 0.3);
          }
        }

        // Evaluate all en-route agents whose paths are impacted
        for (const agent of agents) {
          if (agent.status !== "EN_ROUTE") continue;

          if (disruption.edgeId && this.replanner.isPlanCompromised(agent, disruption.edgeId)) {
            tickEvents.push(`  ↳ Agent ${agent.id} at [${agent.currentLocationNode}] path compromised! Triggering replanner...`);
            totalReplannings++;
            tickReplannings++;

            const context: PlanContext = {
              cargoWeightKg: agent.cargoWeightKg,
              priorityLevel: agent.priorityLevel,
              slaDeadlineMinutes: agent.slaDeadlineMinutes - currentTimeMin,
            };

            const replanRes = this.replanner.replan(agent, context, disruption.edgeId);

            if (replanRes.strategyUsed === "SHADOW_FAILOVER") {
              shadowFailovers++;
              agent.activePlan = replanRes.newPlan;
              agent.status = "EN_ROUTE";
              agent.currentEdgeIndex = 0;
              tickEvents.push(`    ✓ [SHADOW FAILOVER] Seamless 0-wait failover to shadow plan in ${replanRes.executionTimeMs}ms`);
            } else {
              incrementalRepairs++;
              agent.activePlan = replanRes.newPlan;
              agent.status = "EN_ROUTE";
              agent.currentEdgeIndex = 0;
              const speedup = replanRes.benchmark?.speedupVsFullRecompute || 1.0;
              tickEvents.push(`    ✓ [INCREMENTAL REPAIR] Recomputed local path in ${replanRes.executionTimeMs}ms (${speedup}x speedup vs full recompute)`);
            }

            agent.history.push({
              timeMin: currentTimeMin,
              location: agent.currentLocationNode,
              action: `Replanned via ${replanRes.strategyUsed}: ${replanRes.disruptionResolved}`,
            });
          }
        }
      }

      // Advance en-route agents along their current edges
      let anyEnRoute = false;
      for (const agent of agents) {
        if (agent.status === "DELIVERED") continue;
        anyEnRoute = true;

        const currentPlanEdges = agent.activePlan.candidate.edges;
        if (agent.currentEdgeIndex >= currentPlanEdges.length) {
          agent.status = "DELIVERED";
          agent.history.push({ timeMin: currentTimeMin, location: agent.destination, action: "Delivered Successfully" });
          tickEvents.push(`[T=${currentTimeMin}m] Agent ${agent.id} reached destination [${agent.destination}]`);
          continue;
        }

        const currentEdge = currentPlanEdges[agent.currentEdgeIndex];
        const edgeDuration = currentEdge.travelTimeMin || 60;

        // Advance progress
        const progressIncrement = (timeStep / edgeDuration) * 100;
        agent.currentEdgeProgressPct += progressIncrement;

        if (agent.currentEdgeProgressPct >= 100) {
          // Arrived at next node
          agent.currentLocationNode = currentEdge.target;
          agent.currentEdgeIndex++;
          agent.currentEdgeProgressPct = 0;

          agent.history.push({
            timeMin: currentTimeMin,
            location: agent.currentLocationNode,
            action: `Arrived at hub ${agent.currentLocationNode}`,
          });

          if (agent.currentEdgeIndex >= currentPlanEdges.length) {
            agent.status = "DELIVERED";
            tickEvents.push(`[T=${currentTimeMin}m] Agent ${agent.id} DELIVERED at [${agent.destination}]`);
          }
        }
      }

      // Record tick log
      const deliveredCount = agents.filter((a) => a.status === "DELIVERED").length;
      tickLogs.push({
        timeMin: currentTimeMin,
        activeAgents: agents.length - deliveredCount,
        deliveredAgents: deliveredCount,
        disruptionsActive: activeDisruptions.length,
        replanningEventsCount: tickReplannings,
        events: tickEvents,
      });

      // Break if all delivered
      if (!anyEnRoute || deliveredCount === agents.length) {
        break;
      }

      currentTimeMin += timeStep;
    }

    // Compile result summary
    const deliveredCount = agents.filter((a) => a.status === "DELIVERED").length;
    let slaBreachCount = 0;

    const agentSummaries = agents.map((a) => {
      const lastHistory = a.history[a.history.length - 1];
      const deliveryTime = lastHistory ? lastHistory.timeMin : currentTimeMin;
      const metSLA = deliveryTime <= a.slaDeadlineMinutes;
      if (!metSLA) slaBreachCount++;

      return {
        agentId: a.id,
        status: a.status,
        totalTravelTimeMin: deliveryTime,
        slaDeadlineMin: a.slaDeadlineMinutes,
        metSLA,
        routeHistory: a.history.map((h) => `[T=${h.timeMin}m] ${h.location} (${h.action})`),
        replanningsCount: a.history.filter((h) => h.action.includes("Replanned")).length,
      };
    });

    return {
      scenarioName: config.name,
      totalDurationMin: currentTimeMin,
      totalAgents: agents.length,
      deliveredCount,
      slaBreachCount,
      replanningEventsCount: totalReplannings,
      shadowFailoversCount: shadowFailovers,
      incrementalRepairsCount: incrementalRepairs,
      tickLogs,
      agentSummaries,
    };
  }
}
