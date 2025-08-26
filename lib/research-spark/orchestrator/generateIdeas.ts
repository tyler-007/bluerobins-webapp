import { CONFIG as GLOBAL_CONFIG, Config, ALLOWED_PRIMARY_TYPES } from "../prompts";
import { Brief, Candidate, WinnerOutput } from "../types";
import {
  extractSignature,
  generateCruxes,
  selectDiverse,
  generateDescription,
  generateTitle,
  scoreBatch,
  enhanceIdea,
  marketingPolish,
  deriveDifficulty,
} from "../llm/llm";
import { logJson, logSection, logText } from "../utils/log";

export const buildDesignBrief = (
  InterestAreas: string,
  SuitableFor: string,
  ProjectDuration: number,
  ProjectGoal: string,
  ProjectTypes: string[],
  StudentTimeCommitment: number,
  CostForResources: "<$100" | "<$200" | "<$500" | string
  ): Brief => ({
  InterestAreas,
  SuitableFor,
  ProjectDuration,
  ProjectGoal,
  ProjectTypes: ProjectTypes?.length ? ProjectTypes : [...ALLOWED_PRIMARY_TYPES],
  StudentTimeCommitment,
  CostForResources,
});

export const generateIdeas = async (brief: Brief, mentor_bio: string[], config: Config = GLOBAL_CONFIG): Promise<WinnerOutput[]> => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY in env");
  }
  if (!config.deployments.gen) throw new Error("openrtr_GENERATIVE_DEPLOYMENT is not set.");
  if (!config.deployments.reason) throw new Error("openrtr_SYNTHESIS_DEPLOYMENT is not set.");

  // 0) Signature
  const signature = await extractSignature(mentor_bio, config);

  // 1) Generate cruxes
  const N = config.counts.crux_generate_N;
  const raw_cruxes = await generateCruxes(brief, mentor_bio, signature, N, config);
  if (!raw_cruxes.length) throw new Error("No cruxes generated.");

  logSection(`RAW CRUX IDEAS (expected up to ${N})`);
  raw_cruxes.forEach((c, i) => logJson(`[${i + 1}]`, c));

  // 2) Diversity selection
  logSection("STEP 2: Diversity Selection (LLM)");
  const select_M = Math.min(config.counts.select_M, raw_cruxes.length);
  const selected_indices = await selectDiverse(raw_cruxes, select_M, config);
  const selected_cruxes = selected_indices.map((i) => raw_cruxes[i]);
  logSection("SHORTLISTED CRUXES");
  selected_cruxes.forEach((c, i) => logJson(`[${i + 1}]`, c));

  // 3) Descriptions + Titles
  logSection("STEP 3: Descriptions and Titles (per crux)");
  const candidates: Candidate[] = [];
  for (let i = 0; i < selected_cruxes.length; i++) {
    const c = selected_cruxes[i];
    const desc = await generateDescription(brief, c, config);
    const title = await generateTitle(desc, c.PrimaryType || "", brief.SuitableFor, config);
    candidates.push({ Crux: c, ProjectDescription: desc, ProjectTitle: title });
    logJson(`Candidate ${i + 1} - Crux`, c);
    logText(`Candidate ${i + 1} - Description`, desc);
    logText(`Candidate ${i + 1} - Title`, title);
  }

  // 4) Batch scoring round 1
  logSection("STEP 4: Batch Scoring (Round 1)");
  const scoreItems = candidates.map((c, idx) => ({ index: idx, Crux: c.Crux, ProjectTitle: c.ProjectTitle, ProjectDescription: c.ProjectDescription }));
  const scores_round1 = await scoreBatch(brief, mentor_bio, signature, scoreItems, config);
  const scores_map = new Map(scores_round1.map((s) => [s.index!, s]));

  candidates.forEach((c, idx) => {
    const s = scores_map.get(idx) || {};
    c._scores = s;
    c.RelevantIdeaScore = Array.from({ length: 10 }, (_, i) => Number((s as any)[`S${i + 1}`] || 0)).reduce((a, b) => a + b, 0);
    c.ProjectGoalAlignmentScore = 10.0 * Number((s as any)["S4"] || 0);
    logJson(`Candidate ${idx + 1} - Scores (R1)`, s);
  });

  // 5) Enhancement loop
  logSection("STEP 5: Enhancement (LLM-only, targeted)");
  const max_rounds = Math.min(config.thresholds.max_enhance, 2);
  const weak_thr = config.thresholds.weak_checkpoint;

  for (let round_num = 1; round_num <= max_rounds && candidates.length; round_num++) {
    const c_sorted = candidates.map((c, i) => ({ i, s: c.RelevantIdeaScore || 0 })).sort((a, b) => a.s - b.s);
    const bottom_k = candidates.length <= 3 ? 1 : 2;
    const to_improve = c_sorted.slice(0, bottom_k);

    let any_changes = false;
    for (const { i: idxLocal } of to_improve) {
      const item = candidates[idxLocal];
      const s = item._scores || {};
      const weak: Record<string, number> = {};
      for (let j = 1; j <= 10; j++) {
        const k = `S${j}`;
        const v = Number((s as any)[k] || 0);
        if (v < weak_thr) weak[k] = v;
      }
      if (!Object.keys(weak).length) continue;

      const improved = await enhanceIdea(brief, mentor_bio, signature, item, weak, config);
      if (improved?.RevisedCrux) {
        item.Crux = improved.RevisedCrux || item.Crux;
        item.ProjectDescription = improved.RevisedDescription || item.ProjectDescription;
        item.ProjectTitle = improved.RevisedTitle || item.ProjectTitle;
        any_changes = true;
        logJson(`Enhanced Crux (round ${round_num}, idx ${idxLocal})`, item.Crux);
        logText(`Enhanced Description (round ${round_num}, idx ${idxLocal})`, item.ProjectDescription);
        console.log(`[DATA] Enhanced Title (round ${round_num}, idx ${idxLocal}): ${item.ProjectTitle}`);
      }
    }

    if (!any_changes) {
      console.log("[INFO] No enhancements applied this round; stopping.");
      break;
    }

    // Re-score after enhancements
    logSection(`STEP 5B: Batch Scoring After Enhancement Round ${round_num}`);
    const scoreItemsRx = candidates.map((c, idx) => ({ index: idx, Crux: c.Crux, ProjectTitle: c.ProjectTitle, ProjectDescription: c.ProjectDescription }));
    const scores_rx = await scoreBatch(brief, mentor_bio, signature, scoreItemsRx, config);
    const scores_rx_map = new Map(scores_rx.map((s) => [s.index!, s]));
    candidates.forEach((c, idx) => {
      const s = scores_rx_map.get(idx) || c._scores || {};
      c._scores = s;
      c.RelevantIdeaScore = Array.from({ length: 10 }, (_, i) => Number((s as any)[`S${i + 1}`] || 0)).reduce((a, b) => a + b, 0);
      c.ProjectGoalAlignmentScore = 10.0 * Number((s as any)["S4"] || 0);
      logJson(`Candidate ${idx + 1} - Scores (R${round_num + 1})`, c._scores);
    });
  }

  // 6) Winners
  const winners_k = config.counts.winners_k;
  const winners = [...candidates].sort((a, b) => (b.RelevantIdeaScore || 0) - (a.RelevantIdeaScore || 0)).slice(0, winners_k);

  // 7) Marketing polish
  logSection("STEP 7: Marketing polish (winners)");
  for (let i = 0; i < winners.length; i++) {
    try {
      const w = winners[i];
      const { title, description } = await marketingPolish(brief, w.Crux, w.ProjectTitle, w.ProjectDescription, config);
      w.ProjectTitle = title;
      w.ProjectDescription = description;
      logText(`Marketing Title (winner ${i + 1})`, title);
      logText(`Marketing Description (winner ${i + 1})`, description);
    } catch (e) {
      console.warn(`[WARN] Marketing polish failed for winner ${i + 1}:`, e);
    }
  }

  // 8) Final winners log (optional)
  logSection(`STEP 8: FINAL WINNERS (Top ${winners_k})`);
  winners.forEach((w, i) => {
    console.log(`[${i + 1}] ${w.ProjectTitle} | Score: ${(w.RelevantIdeaScore || 0).toFixed(1)}`);
    console.log(`Desc:\n${w.ProjectDescription}`);
    logJson(`Winner ${i + 1} - Scores`, w._scores || {});
  });

  // 9) Final assembly
  const finals: WinnerOutput[] = winners.map((w) => {
    const crux = w.Crux;
    const desc = w.ProjectDescription;
    const title = w.ProjectTitle;
    const scores = w._scores || {};
    const difficulty = deriveDifficulty(crux.SuitableFor || brief.SuitableFor, crux.Method || "");
    const tools = Array.isArray(crux.Tools)
      ? crux.Tools
      : String(crux.Tools || "")
          .split(/[;,]/)
          .map((t) => t.trim())
          .filter(Boolean);
    const dataRes = Array.isArray(crux.DataOrResources)
      ? crux.DataOrResources
      : String(crux.DataOrResources || "")
          .split(/[;,]/)
          .map((d) => d.trim())
          .filter(Boolean);
    const equip = [...tools, ...dataRes, `Total Cost: ${brief.CostForResources}`];

    return {
      ProjectTitle: title,
      ProjectDescription: desc,
      DifficultyLevel: difficulty,
      EquipmentNeededAndCost: equip,
      ProjectType: crux.PrimaryType,
      // ProjectGoalAlignmentScore: 10.0 * Number(scores["S4"] || 0),
      SuitableFor: brief.SuitableFor,
      ProjectDuration: brief.ProjectDuration,
      // StudentTimeCommitment: brief.StudentTimeCommitment,
      // RelevantIdeaScore: Number(w.RelevantIdeaScore || 0),
      // ScoreBreakdown: scores,
      // GoalDeliverable: crux.GoalDeliverable,
      EarlyWow: crux.EarlyWow,
      // TimePlan: crux.TimePlan,
      // CostBracket: crux.CostBracket,
      // MentorSignatureUsed: signature,
    };
  });

  return finals;
};