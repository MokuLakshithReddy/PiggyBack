/**
 * Unified Canonical Engine Interface for PiggyBack
 * Connects the mathematical optimization core (MOSAIC) with runtime state, adapters, and data models.
 */

// Core Algorithmic Framework
export * as core from "../../core";

// Engine Runtime & Data Types
export * from "./types";
export * from "./optimizer";
export * from "./candidate-generator";
export * from "./capacity-graph";
export * from "./constraints";
export * from "./receipt-builder";
export { DisruptionEngine } from "./disruptions";
export * from "./state-manager";
export * from "./autopsy";
export * from "./seed";
export * from "./road-routes";
