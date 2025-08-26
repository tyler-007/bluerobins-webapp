export { CONFIG, ALLOWED_PRIMARY_TYPES } from "./prompts";
export type { Config } from "./prompts";
export type { Brief, Crux, Candidate, GenerateIdeasInput, GenerateIdeasResult, WinnerOutput } from "./types";
export { generateIdeas, buildDesignBrief } from "./orchestrator/generateIdeas";


// ---------------------session plan-------------------


// Session plan module exports
export { generateSessionPlan } from "../research-spark/orchestrator/sessionPlan";
export * as SessionPlanTypes from "../research-spark/types";
export * as SessionPlanConfig from "../research-spark/prompts";
