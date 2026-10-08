import { Graph } from "../graph/graph";
import { GraphEdge } from "../graph/types";
import { ScoredPlan } from "../optimizer/types";
import { PlanContext } from "../constraints/types";

export type DisruptionType =
  | "ROAD_BLOCKED"
  | "ROAD_CONGESTED"
  | "ROAD_CLEARED"
  | "CAPACITY_REDUCED"
  | "VEHICLE_BREAKDOWN";

export interface SimulationDisruption {
  id: string;
  triggerTimeMin: number;
  type: DisruptionType;
  edgeId?: string;
  sourceNode?: string;
  targetNode?: string;
  severity?: number; // e.g. delay multiplier or capacity reduction
  description: string;
}

export interface SimulationAgent {
  id: string;
  cargoWeightKg: number;
  priorityLevel: 1 | 2 | 3;
  source: string;
  destination: string;
  slaDeadlineMinutes: number;
  currentLocationNode: string;
  currentEdgeProgressPct: number; // 0 to 100%
  currentEdgeIndex: number;
  activePlan: ScoredPlan;
  shadowPlan: ScoredPlan | null;
  status: "EN_ROUTE" | "DELAYED" | "REPLANNING" | "DELIVERED" | "STRANDED";
  history: {
    timeMin: number;
    location: string;
    action: string;
  }[];
}

export interface SimulationTickLog {
  timeMin: number;
  activeAgents: number;
  deliveredAgents: number;
  disruptionsActive: number;
  replanningEventsCount: number;
  events: string[];
}

export interface SimulationScenarioConfig {
  name: string;
  description: string;
  initialGraph: Graph;
  agents: {
    id: string;
    source: string;
    destination: string;
    cargoWeightKg: number;
    priorityLevel: 1 | 2 | 3;
    slaDeadlineMinutes: number;
  }[];
  scheduledDisruptions: SimulationDisruption[];
  maxSimulationTimeMin?: number;
  timeStepMin?: number;
}
