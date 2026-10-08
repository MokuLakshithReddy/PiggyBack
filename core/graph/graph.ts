import { Coordinates, EdgeStatus, GraphEdge, GraphMetrics, GraphNode } from "./types";

/**
 * Universal Graph Engine Abstraction
 * Independent of data source (OSM, synthetic grid, pan-India hubs, GeoJSON)
 */
export class Graph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private adjacency: Map<string, Map<string, GraphEdge>> = new Map();

  constructor() {}

  public addNode(node: GraphNode): void {
    this.nodes.set(node.id, { ...node });
    if (!this.adjacency.has(node.id)) {
      this.adjacency.set(node.id, new Map());
    }
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  public hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  public addEdge(edge: GraphEdge): void {
    if (!this.nodes.has(edge.source) || !this.nodes.has(edge.target)) {
      throw new Error(`Cannot add edge ${edge.id}: source (${edge.source}) or target (${edge.target}) does not exist`);
    }

    const storedEdge: GraphEdge = { ...edge };
    this.edges.set(storedEdge.id, storedEdge);

    if (!this.adjacency.has(storedEdge.source)) {
      this.adjacency.set(storedEdge.source, new Map());
    }
    this.adjacency.get(storedEdge.source)!.set(storedEdge.target, storedEdge);

    if (storedEdge.bidirectional) {
      const reverseEdgeId = `${storedEdge.id}_rev`;
      const reverseEdge: GraphEdge = {
        ...storedEdge,
        id: reverseEdgeId,
        source: storedEdge.target,
        target: storedEdge.source,
      };
      this.edges.set(reverseEdgeId, reverseEdge);

      if (!this.adjacency.has(storedEdge.target)) {
        this.adjacency.set(storedEdge.target, new Map());
      }
      this.adjacency.get(storedEdge.target)!.set(storedEdge.source, reverseEdge);
    }
  }

  public getEdge(id: string): GraphEdge | undefined {
    return this.edges.get(id);
  }

  public getEdgeBetween(source: string, target: string): GraphEdge | undefined {
    return this.adjacency.get(source)?.get(target);
  }

  public getAllEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }

  public getNeighbors(nodeId: string): { node: GraphNode; edge: GraphEdge }[] {
    const neighborMap = this.adjacency.get(nodeId);
    if (!neighborMap) return [];

    const neighbors: { node: GraphNode; edge: GraphEdge }[] = [];
    for (const [targetId, edge] of neighborMap.entries()) {
      const node = this.nodes.get(targetId);
      if (node) {
        neighbors.push({ node, edge });
      }
    }
    return neighbors;
  }

  public setEdgeStatus(edgeId: string, status: EdgeStatus): boolean {
    const edge = this.edges.get(edgeId);
    if (!edge) return false;
    edge.status = status;

    // Also update reverse if bidirectional
    const revId = edgeId.endsWith("_rev") ? edgeId.replace("_rev", "") : `${edgeId}_rev`;
    const revEdge = this.edges.get(revId);
    if (revEdge) {
      revEdge.status = status;
    }
    return true;
  }

  public updateEdgeLoad(edgeId: string, additionalLoadKg: number): boolean {
    const edge = this.edges.get(edgeId);
    if (!edge) return false;
    edge.currentLoadKg = (edge.currentLoadKg || 0) + additionalLoadKg;
    return true;
  }

  public getMetrics(): GraphMetrics {
    const allEdges = this.getAllEdges();
    const active = allEdges.filter((e) => e.status === "ACTIVE").length;
    const blocked = allEdges.filter((e) => e.status === "BLOCKED").length;
    const congested = allEdges.filter((e) => e.status === "CONGESTED").length;
    const totalNodes = this.nodes.size;

    return {
      totalNodes,
      totalEdges: allEdges.length,
      activeEdges: active,
      blockedEdges: blocked,
      congestedEdges: congested,
      averageDegree: totalNodes > 0 ? (allEdges.length / totalNodes) : 0,
    };
  }

  public clone(): Graph {
    const copy = new Graph();
    for (const node of this.nodes.values()) {
      copy.addNode({ ...node });
    }
    for (const edge of this.edges.values()) {
      if (!edge.id.endsWith("_rev")) {
        copy.addEdge({ ...edge });
      }
    }
    return copy;
  }

  /**
   * Spatial Haversine distance in kilometers between two coordinate pairs
   */
  public static haversineDistanceKm(c1: Coordinates, c2: Coordinates): number {
    const R = 6371; // Earth radius in km
    const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
    const dLon = ((c2.lng - c1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((c1.lat * Math.PI) / 180) *
        Math.cos((c2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
