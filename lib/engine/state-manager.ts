import {
  AutopsyReport,
  DecisionReceipt,
  DisruptionPayload,
  DisruptionResult,
  Hub,
  RecoveryPlan,
  StaffShipment,
  Truck,
  Cargo,
} from "./types";
import { SEED_HUBS, SEED_TRUCKS, SEED_SHIPMENTS, SEED_CARGO, getFreshSeedData } from "./seed";
import { CandidateGenerator } from "./candidate-generator";
import { LexicographicOptimizer, OptimizationResult } from "./optimizer";
import { ReceiptBuilder } from "./receipt-builder";
import { AutopsyEngine } from "./autopsy";
import { DisruptionEngine } from "./disruptions";

const CURRENT_STATE_VERSION = 7;

const STORAGE_KEYS = {
  shipments: "pgb_mosaic_shipments",
  trucks: "pgb_mosaic_trucks",
  hubs: "pgb_mosaic_hubs",
  cargo: "pgb_mosaic_cargo",
  plans: "pgb_mosaic_plans",
  receipts: "pgb_mosaic_receipts",
  version: "pgb_mosaic_version",
};

type Listener = () => void;

class StateManager {
  private static instance: StateManager;

  private shipments: StaffShipment[] = [];
  private trucks: Truck[] = [];
  private hubs: Hub[] = [];
  private cargo: Cargo[] = [];
  private plans: Record<string, RecoveryPlan[]> = {}; // shipmentId -> RecoveryPlan[]
  private receipts: Record<string, DecisionReceipt> = {}; // shipmentId -> DecisionReceipt
  private version: number = 1;
  private listeners: Set<Listener> = new Set();
  private initialized: boolean = false;
  private isNotifying: boolean = false;
  private pendingNotify: boolean = false;

  private constructor() {
    this.loadState();
  }

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  private loadState() {
    if (typeof window === "undefined") {
      const fresh = getFreshSeedData();
      this.shipments = fresh.shipments;
      this.trucks = fresh.trucks;
      this.hubs = fresh.hubs;
      this.cargo = fresh.cargo;
      this.initialized = true;
      return;
    }

    try {
      const s = localStorage.getItem(STORAGE_KEYS.shipments);
      const t = localStorage.getItem(STORAGE_KEYS.trucks);
      const h = localStorage.getItem(STORAGE_KEYS.hubs);
      const c = localStorage.getItem(STORAGE_KEYS.cargo);
      const p = localStorage.getItem(STORAGE_KEYS.plans);
      const r = localStorage.getItem(STORAGE_KEYS.receipts);
      const v = localStorage.getItem(STORAGE_KEYS.version);

      const parsedVersion = v ? parseInt(v, 10) : 0;
      let parsedShipments: StaffShipment[] = s ? JSON.parse(s) : [];

      // Check if state is stale (old version, empty, or expired shipment deadlines)
      const isStale =
        parsedVersion < CURRENT_STATE_VERSION ||
        parsedShipments.length === 0 ||
        parsedShipments.some((sh) => new Date(sh.deadline).getTime() <= Date.now());

      if (isStale) {
        this.resetToDefault();
        return;
      }

      this.shipments = parsedShipments;
      this.trucks = t ? JSON.parse(t) : getFreshSeedData().trucks;
      this.hubs = h ? JSON.parse(h) : getFreshSeedData().hubs;
      this.cargo = c ? JSON.parse(c) : getFreshSeedData().cargo;
      this.plans = p ? JSON.parse(p) : {};
      this.receipts = r ? JSON.parse(r) : {};
      this.version = parsedVersion;
    } catch {
      this.resetToDefault();
    }
    this.initialized = true;
  }

  private saveState() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.shipments, JSON.stringify(this.shipments));
      localStorage.setItem(STORAGE_KEYS.trucks, JSON.stringify(this.trucks));
      localStorage.setItem(STORAGE_KEYS.hubs, JSON.stringify(this.hubs));
      localStorage.setItem(STORAGE_KEYS.cargo, JSON.stringify(this.cargo));
      localStorage.setItem(STORAGE_KEYS.plans, JSON.stringify(this.plans));
      localStorage.setItem(STORAGE_KEYS.receipts, JSON.stringify(this.receipts));
      localStorage.setItem(STORAGE_KEYS.version, this.version.toString());
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    if (this.isNotifying) {
      this.pendingNotify = true;
      return;
    }
    this.isNotifying = true;
    try {
      this.listeners.forEach((l) => {
        try {
          l();
        } catch (e) {
          console.error("State listener error:", e);
        }
      });
    } finally {
      this.isNotifying = false;
      if (this.pendingNotify) {
        this.pendingNotify = false;
        // Schedule next notify asynchronously to completely avoid stack recursion
        if (typeof queueMicrotask === "function") {
          queueMicrotask(() => this.notify());
        } else {
          setTimeout(() => this.notify(), 0);
        }
      }
    }
  }

  // ─── Getters ──────────────────────────────────────────────────
  public getVersion(): number {
    return this.version;
  }

  public getShipments(): StaffShipment[] {
    return [...this.shipments];
  }

  public getShipment(id: string): StaffShipment | undefined {
    return this.shipments.find((s) => s.id.toLowerCase() === id.toLowerCase());
  }

  public getTrucks(): Truck[] {
    return [...this.trucks];
  }

  public getTruck(id: string): Truck | undefined {
    return this.trucks.find((t) => t.id.toLowerCase() === id.toLowerCase());
  }

  public getHubs(): Hub[] {
    return [...this.hubs];
  }

  public getHub(idOrName: string): Hub | undefined {
    const q = idOrName.toLowerCase();
    return this.hubs.find((h) => h.id.toLowerCase() === q || h.name.toLowerCase() === q);
  }

  public getCargo(): Cargo[] {
    return [...this.cargo];
  }

  public getPlans(shipmentId: string): RecoveryPlan[] {
    return this.plans[shipmentId] || [];
  }

  public getReceipt(shipmentId: string): DecisionReceipt | undefined {
    return this.receipts[shipmentId];
  }

  // ─── Optimization & Recovery ──────────────────────────────────
  public solveRecovery(shipmentId: string): {
    receipt: DecisionReceipt;
    primaryPlan: RecoveryPlan | null;
    shadowPlan: RecoveryPlan | null;
    optimizationResult: OptimizationResult;
  } {
    const shipment = this.getShipment(shipmentId);
    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found`);
    }

    // Build maintenance windows map and operational status from hubs
    const hubMaintenanceWindows: Record<string, { startHour: number; endHour: number }> = {};
    const hubOperationalStatus: Record<string, boolean> = {};
    for (const h of this.hubs) {
      if (h.maintenanceWindow) {
        hubMaintenanceWindows[h.name] = h.maintenanceWindow;
        hubMaintenanceWindows[h.name.toLowerCase()] = h.maintenanceWindow;
        hubMaintenanceWindows[h.id] = h.maintenanceWindow;
        hubMaintenanceWindows[h.id.toLowerCase()] = h.maintenanceWindow;
      }
      hubOperationalStatus[h.name] = h.isOperational;
      hubOperationalStatus[h.name.toLowerCase()] = h.isOperational;
      hubOperationalStatus[h.id] = h.isOperational;
      hubOperationalStatus[h.id.toLowerCase()] = h.isOperational;
      if (h.code) {
        hubOperationalStatus[h.code] = h.isOperational;
        hubOperationalStatus[h.code.toLowerCase()] = h.isOperational;
      }
    }

    // 1. Candidate Generation
    const candidateGen = new CandidateGenerator(
      this.trucks,
      new Date().toISOString(),
      hubMaintenanceWindows,
      hubOperationalStatus
    );
    const candidates = candidateGen.generateCandidates(shipment);

    // 2. Lexicographical Optimization (Primary + Shadow)
    const optimizer = new LexicographicOptimizer(shipment, candidates);
    const optResult = optimizer.solve();

    // 3. Build Decision Receipt
    const receipt = ReceiptBuilder.buildReceipt({
      shipment,
      status: optResult.status,
      planId: optResult.primaryPlan?.planId,
      allCandidates: candidates,
      selectedCandidate: optResult.primaryPlan?.candidate,
      solveTimeMs: optResult.solveTimeMs,
    });

    // Save plans and receipt
    const plansToSave: RecoveryPlan[] = [];
    if (optResult.primaryPlan) plansToSave.push(optResult.primaryPlan);
    if (optResult.shadowPlan) plansToSave.push(optResult.shadowPlan);

    this.plans[shipment.id] = plansToSave;
    this.receipts[shipment.id] = receipt;
    this.version += 1;
    this.saveState();

    return {
      receipt,
      primaryPlan: optResult.primaryPlan,
      shadowPlan: optResult.shadowPlan,
      optimizationResult: optResult,
    };
  }

  // ─── Plan Execution / Approval ────────────────────────────────
  public approvePlan(planId: string): { success: boolean; plan: RecoveryPlan; shipment: StaffShipment } {
    let foundPlan: RecoveryPlan | null = null;
    let foundShipmentId = "";

    for (const [sId, pList] of Object.entries(this.plans)) {
      const match = pList.find((p) => p.planId === planId);
      if (match) {
        foundPlan = match;
        foundShipmentId = sId;
        break;
      }
    }

    if (!foundPlan) {
      throw new Error(`Plan ${planId} not found`);
    }

    // Update plan status
    foundPlan.status = "APPROVED";

    // Update shipment
    this.shipments = this.shipments.map((s) => {
      if (s.id === foundShipmentId) {
        return {
          ...s,
          status: "Recovery Found" as const,
          assignedTruck: foundPlan!.vehicleId,
          activePlanId: foundPlan!.planId,
          currentLocation: `${foundPlan!.pickupHub} (Piggyback Handover)`,
        };
      }
      return s;
    });

    // Deduct available capacity from assigned truck
    const shipment = this.getShipment(foundShipmentId)!;
    const vIds = foundPlan.vehicleId.split("+").map((s) => s.trim());
    this.trucks = this.trucks.map((t) => {
      if (vIds.includes(t.id)) {
        return {
          ...t,
          availableCapacity: Math.max(0, t.availableCapacity - shipment.weight),
          availableVolume: Math.max(0, t.availableVolume - shipment.volume),
          status: "Assigned" as const,
        };
      }
      return t;
    });

    this.version += 1;
    this.saveState();

    return {
      success: true,
      plan: foundPlan,
      shipment,
    };
  }

  // ─── Disruption Injection ─────────────────────────────────────
  public injectDisruption(payload: DisruptionPayload): DisruptionResult {
    const res = DisruptionEngine.inject(payload, {
      shipments: this.shipments,
      trucks: this.trucks,
      hubs: this.hubs,
      stateVersion: this.version,
    });

    this.shipments = res.updatedShipments;
    this.trucks = res.updatedTrucks;
    this.hubs = res.updatedHubs;
    this.version = res.result.stateVersion;

    // Invalidate stale recovery plans for any affected shipments
    for (const sId of res.result.affectedShipmentIds) {
      delete this.plans[sId];
      delete this.receipts[sId];
    }

    this.saveState();
    return res.result;
  }

  // ─── Autopsy ──────────────────────────────────────────────────
  public getAutopsy(shipmentId: string): AutopsyReport {
    const shipment = this.getShipment(shipmentId);
    if (!shipment) throw new Error(`Shipment ${shipmentId} not found`);

    const plans = this.getPlans(shipmentId);
    const executed = plans.find((p) => p.status === "APPROVED" || p.status === "EXECUTING") || plans[0];

    if (!executed) {
      // Auto-generate a plan if none exists or generate root-cause failure autopsy report
      const solve = this.solveRecovery(shipmentId);
      const p = solve.primaryPlan;
      return AutopsyEngine.generateReport(shipment, p);
    }

    return AutopsyEngine.generateReport(shipment, executed);
  }

  public reopenHub(hubNameOrId: string): Hub | null {
    let reopened: Hub | null = null;
    this.hubs = this.hubs.map((h) => {
      if (
        h.id.toLowerCase() === hubNameOrId.toLowerCase() ||
        h.name.toLowerCase() === hubNameOrId.toLowerCase() ||
        h.code.toLowerCase() === hubNameOrId.toLowerCase()
      ) {
        reopened = { ...h, isOperational: true };
        return reopened;
      }
      return h;
    });
    if (reopened) {
      this.version += 1;
      this.saveState();
    }
    return reopened;
  }

  public deployEmergencyCharter(shipmentId: string): RecoveryPlan {
    const shipment = this.getShipment(shipmentId);
    if (!shipment) throw new Error(`Shipment ${shipmentId} not found`);

    const planId = `PLAN-EMERGENCY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const nowMs = Date.now();
    const charterPlan: RecoveryPlan = {
      planId,
      shipmentId: shipment.id,
      strategy: "PRIMARY",
      vehicleId: "CHARTER-EXP-01",
      pickupHub: shipment.currentLocation,
      dropoffHub: shipment.destination,
      eta: new Date(nowMs + 12 * 3600000).toISOString(),
      incrementalCost: 1450,
      extraDistance: 1420,
      slaMarginMinutes: 480,
      transfers: 0,
      status: "APPROVED",
      createdAt: new Date().toISOString(),
      candidate: {
        id: `CAND-EMERGENCY-${planId}`,
        shipmentId: shipment.id,
        vehicleId: "CHARTER-EXP-01",
        pickupHub: shipment.currentLocation,
        dropoffHub: shipment.destination,
        pickupTime: new Date(nowMs + 30 * 60000).toISOString(),
        dropoffTime: new Date(nowMs + 12 * 3600000).toISOString(),
        pathMinWeight: 2000,
        pathMinVolume: 25,
        isTransfer: false,
        transfers: 0,
        downstreamDelayMinutes: 0,
        delayMinutes: 0,
        incrementalCost: 1450,
        distance: 1420,
        isFeasible: true,
        rejectionReason: null,
      },
    };

    this.plans[shipment.id] = [charterPlan];
    this.shipments = this.shipments.map((s) => {
      if (s.id === shipment.id) {
        return {
          ...s,
          status: "Recovery Found" as const,
          assignedTruck: "CHARTER-EXP-01",
          activePlanId: planId,
          disruptionReason: `Emergency bypass charter authorized from ${shipment.currentLocation} Satellite Hub`,
        };
      }
      return s;
    });

    this.version += 1;
    this.saveState();
    return charterPlan;
  }

  // ─── Reset ────────────────────────────────────────────────────
  public resetToDefault(baseTime: number = Date.now()) {
    const fresh = getFreshSeedData(baseTime);
    this.shipments = fresh.shipments;
    this.trucks = fresh.trucks;
    this.hubs = fresh.hubs;
    this.cargo = fresh.cargo;
    this.plans = {};
    this.receipts = {};
    this.version = CURRENT_STATE_VERSION;
    this.saveState();
  }

  public reoptimize(shipmentId: string) {
    delete this.plans[shipmentId];
    delete this.receipts[shipmentId];
    return this.solveRecovery(shipmentId);
  }
}

export const stateManager = StateManager.getInstance();
