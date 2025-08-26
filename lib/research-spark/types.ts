export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface Brief {
  InterestAreas: string;
  SuitableFor: string;
  ProjectDuration: number;
  ProjectGoal: string;
  ProjectTypes: string[];
  StudentTimeCommitment: number;
  CostForResources: "<$100" | "<$200" | "<$500" | string; // lib allows string; pipeline enforces bracket
}

export interface Crux {
  PrimaryType: string;
  CoreIdea: string;
  Artifact: string;
  Method: string;
  DataOrResources: string | string[];
  Tools: string[] | string;
  EarlyWow: string;
  CostBracket: "<$100" | "<$200" | "<$500" | string;
  TimePlan: string;
  SuitableFor: string;
  GoalDeliverable: string;
}

export interface Candidate {
  Crux: Crux;
  ProjectDescription: string;
  ProjectTitle: string;
  _scores?: ScoreBreakdown;
  RelevantIdeaScore?: number;
  ProjectGoalAlignmentScore?: number;
}

export interface ScoreBreakdown {
  index?: number;
  S1?: number; S2?: number; S3?: number; S4?: number; S5?: number;
  S6?: number; S7?: number; S8?: number; S9?: number; S10?: number;
  Reasons?: { [k: string]: string };
}

export interface WinnerOutput {
  ProjectTitle: string;
  ProjectDescription: string;
  DifficultyLevel: "Beginner" | "Intermediate" | "Advanced";
  EquipmentNeededAndCost: string[];
  ProjectType: string;
  // ProjectGoalAlignmentScore: number;
  SuitableFor: string;
  ProjectDuration: number;
  // StudentTimeCommitment: number;
  // RelevantIdeaScore: number;
  // ScoreBreakdown: ScoreBreakdown;
  // GoalDeliverable: string;
  EarlyWow: string;
  // TimePlan: string;
  // CostBracket: string;
  // MentorSignatureUsed: string[];
}

export interface GenerateIdeasInput {
  brief: Brief;
  mentor_bio: string[];
  // Optional override config knobs for a playground; otherwise use defaults.
  overrides?: Partial<import("./prompts").Config>;
}

export interface GenerateIdeasResult {
  results: WinnerOutput[];
}

// ------------------ session plan --------------------
export interface WeekEntry {
  week: number;
  dateStr: string; // internal, do not print in output
}

export interface GenerateSessionPlanOptions {
  printDrafts?: boolean;
  tones?: string[];
  defaultWeeksIfMissingDates?: number;
  hoursMap?: Record<number | "default", number>;
  finalWeekHoursIf8Plus?: number | null;
  agenda?: any;
}

export interface PlanSignatures {
  ValuesLines: string[];
  MustDeliverables: string[];
  MustMetrics: string[];
}

export interface GenerateSessionPlanResult {
  finalPlan: string;
}
