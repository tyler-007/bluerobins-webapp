import { CONFIG as GLOBAL_CONFIG, ALLOWED_PRIMARY_TYPES, Config } from "../prompts";
import { Brief, Crux, Candidate, ScoreBreakdown, WinnerOutput } from "../types";
import { callOpenRouterChat, callOpenRouterReasoning } from "../clients/openrouter";
import { parseJsonSafely } from "../utils/json";
import { renderMentorBioText, toolsToStr } from "../utils/text";
import { logJson, logSection, logText } from "../utils/log";
const _cruxKey = (c: any) =>
  `${String(c?.PrimaryType || "").trim().toLowerCase()}|${String(c?.CoreIdea || "").trim().toLowerCase()}`;


export const extractSignature = async (mentor_bio: string[], config: Config = GLOBAL_CONFIG): Promise<string[]> => {
  logSection("STEP 0: Extract Mentor Signature");
  const sys_p = config.prompts.SIGNATURE_SYSTEM;
  const usr_p = config.prompts.SIGNATURE_USER.replace("{MentorBio}", renderMentorBioText(mentor_bio));
  const resp = await callOpenRouterChat(
    config.deployments.gen,
    sys_p,
    usr_p,
    { max_tokens: 400, temperature: (config as any).temperatures?.signature ?? GLOBAL_CONFIG.temperature }
  );
  const arr = parseJsonSafely(resp || "");
  if (Array.isArray(arr)) {
    const tokens = arr.map((x) => String(x)).slice(0, 20);
    logJson("Mentor Signature (parsed)", tokens);
    return tokens;
  }
  console.warn("[WARN] Mentor Signature extraction failed; proceeding with empty list.");
  return [];
};


export const generateCruxes = async (
  brief: Brief,
  mentor_bio: string[],
  signature_tokens: string[],
  N: number,
  config: Config = GLOBAL_CONFIG
): Promise<Crux[]> => {
  logSection("STEP 1: Generate Raw Crux Ideas");
  const sys_p = config.prompts.CRUX_SYSTEM;
  const used = new Map<string, Crux>();
  let attempts = 0;
  const max_attempts = 4;
  while (used.size < N && attempts < max_attempts) {
    attempts += 1;
    const remaining = N - used.size;
    const usr_p = config.prompts.CRUX_USER
      .replace("{InterestAreas}", brief.InterestAreas)
      .replace("{SuitableFor}", brief.SuitableFor)
      .replace("{ProjectDuration}", String(brief.ProjectDuration))
      .replace("{ProjectGoal}", brief.ProjectGoal)
      .replace("{ProjectTypes}", (brief.ProjectTypes || ALLOWED_PRIMARY_TYPES).join(", "))
      .replace("{StudentTimeCommitment}", String(brief.StudentTimeCommitment))
      .replace("{CostForResources}", brief.CostForResources)
      .replace("{MentorBio}", renderMentorBioText(mentor_bio))
      .replace("{MentorSignature}", signature_tokens.join(", "))
      .replace("{AllowedTypes}", ALLOWED_PRIMARY_TYPES.join(", "))
      .replace("{N}", String(remaining));
    const resp = await callOpenRouterChat(config.deployments.gen, sys_p, usr_p, {
      max_tokens: 2200,
      temperature: (config as any).temperatures?.crux ?? GLOBAL_CONFIG.temperature,
    });
    const data = parseJsonSafely(resp || "");
    const batch = Array.isArray(data) ? data : [];
    for (const c of batch) {
      if (c && typeof c === "object") {
        const k = _cruxKey(c);
        if (k && !used.has(k)) used.set(k, c as Crux);
      }
    }
    console.log(`[INFO] Generation attempt ${attempts}: received ${batch.length}; unique total ${used.size}/${N}.`);
  }
  const cruxes = Array.from(used.values()).slice(0, N);
  logJson(`Raw Cruxes (parsed, aiming for ${N})`, cruxes);
  console.log(`[INFO] Generated ${cruxes.length} raw crux ideas (target ${N}).`);
  return cruxes;
};
export const selectDiverse = async (cruxes: Crux[], M: number, config: Config = GLOBAL_CONFIG): Promise<number[]> => {
  const sys_p = config.prompts.DIVERSE_SYSTEM;
  const indexed = cruxes.map((c, i) => ({ index: i, PrimaryType: c.PrimaryType || "", CoreIdea: c.CoreIdea || "", Artifact: c.Artifact || "" }));
  const usr_p = config.prompts.DIVERSE_USER
    .replace("{M}", String(M))
    .replace("{IndexedCruxJSON}", JSON.stringify(indexed, null, 2));
  const resp = await callOpenRouterReasoning(
    config.deployments.reason,
    sys_p,
    usr_p,
    { max_completion_tokens: 800, reasoning_effort: "low" }
  );
  const data = parseJsonSafely(resp || "");
  let idxs: number[] = (data && typeof data === "object" && Array.isArray(data.SelectedIndices))
    ? data.SelectedIndices
    : [];
  idxs = idxs.filter((i) => Number.isInteger(i) && i >= 0 && i < cruxes.length);
  if (idxs.length > M) idxs = idxs.slice(0, M);
  else if (idxs.length < M) {
    const missing = Array.from({ length: cruxes.length }, (_, i) => i).filter((i) => !idxs.includes(i));
    idxs.push(...missing.slice(0, M - idxs.length));
  }
  logJson("Diverse Selection Indices", { SelectedIndices: idxs, M });
  return idxs;
};
export const generateDescription = async (brief: Brief, crux: Crux, config: Config = GLOBAL_CONFIG): Promise<string> => {
  const sys_p = config.prompts.DESC_SYSTEM;
  const usr_p = config.prompts.DESC_USER
    .replace("{InterestAreas}", brief.InterestAreas)
    .replace("{SuitableFor}", brief.SuitableFor)
    .replace("{ProjectDuration}", String(brief.ProjectDuration))
    .replace("{ProjectGoal}", brief.ProjectGoal)
    .replace("{ProjectTypes}", (brief.ProjectTypes || ALLOWED_PRIMARY_TYPES).join(", "))
    .replace("{StudentTimeCommitment}", String(brief.StudentTimeCommitment))
    .replace("{CostForResources}", brief.CostForResources)
    .replace("{PrimaryType}", crux.PrimaryType || "")
    .replace("{CoreIdea}", crux.CoreIdea || "")
    .replace("{Artifact}", crux.Artifact || "")
    .replace("{Method}", crux.Method || "")
    .replace("{DataOrResources}", Array.isArray(crux.DataOrResources) ? crux.DataOrResources.join(", ") : (crux.DataOrResources || ""))
    .replace("{Tools}", toolsToStr(crux.Tools))
    .replace("{EarlyWow}", crux.EarlyWow || "")
    .replace("{CostBracket}", crux.CostBracket || "")
    .replace("{TimePlan}", crux.TimePlan || "")
    // ensure we pass a string even if SuitableFor came back as array/object
    .replaceAll("{SuitableFor}", String((crux as any).SuitableFor ?? brief.SuitableFor))
    .replace("{GoalDeliverable}", crux.GoalDeliverable || "");
  const gen = config.deployments.gen;
  const gen_full = config.deployments.gen_full || gen;
  let resp = await callOpenRouterChat(gen_full, sys_p, usr_p, { max_tokens: 320, temperature: (config as any).temperatures?.desc ?? GLOBAL_CONFIG.temperature });
  if (!resp || !resp.trim()) {
    resp = await callOpenRouterChat(gen, sys_p, usr_p, { max_tokens: 320, temperature: (config as any).temperatures?.desc ?? GLOBAL_CONFIG.temperature });
  }
  if (!resp || !resp.trim()) {
    console.error("[ERROR] Description generation failed.");
    return "";
  }
  return resp.trim().replace(/^"+|"+$/g, "");
};
export const generateTitle = async (description: string, primaryType: string, suitableFor: string, config: Config = GLOBAL_CONFIG): Promise<string> => {
  const sys_p = config.prompts.TITLE_SYSTEM;
  const usr_p = config.prompts.TITLE_USER
    .replace("{ProjectDescription}", description)
    .replace("{PrimaryType}", primaryType)
    .replace("{SuitableFor}", suitableFor);
  const resp = await callOpenRouterChat(
    config.deployments.gen,
    sys_p,
    usr_p,
    { max_tokens: 50, temperature: (config as any).temperatures?.title ?? GLOBAL_CONFIG.temperature }
  );
  if (!resp || !resp.trim()) {
    console.error("[ERROR] Title generation failed.");
    return "";
  }
  let title = resp.trim().replace(/"/g, "").replace(/:/g, "");
  const words = title.split(/\s+/);
  if (words.length > 9) title = words.slice(0, 9).join(" ");
  return title;
};
export const scoreBatch = async (
  brief: Brief,
  mentor_bio: string[],
  mentor_signature: string[],
  items: { index: number; Crux: Crux; ProjectTitle: string; ProjectDescription: string }[],
  config: Config = GLOBAL_CONFIG
): Promise<ScoreBreakdown[]> => {
  const sys_p = config.prompts.SCORE_SYSTEM;
  const payloadItems = items.map((it) => ({
    index: it.index,
    Crux: it.Crux,
    Title: it.ProjectTitle,
    Description: it.ProjectDescription,
  }));
  const usr_p =
    `DesignBrief:
InterestAreas: ${brief.InterestAreas}
SuitableFor: ${brief.SuitableFor}
ProjectDuration: ${brief.ProjectDuration} weeks
ProjectGoal: ${brief.ProjectGoal}
ProjectTypes: ${(brief.ProjectTypes || ALLOWED_PRIMARY_TYPES).join(", ")}
StudentTimeCommitment: ${brief.StudentTimeCommitment} hr/week
CostForResources: ${brief.CostForResources}
MentorSignature (hints): ${mentor_signature.join(", ")}
MentorBio:
${renderMentorBioText(mentor_bio)}
Score ALL ideas below. Return JSON ONLY with 'results': [{index, S1..S10, Reasons}].
Ideas JSON:
${JSON.stringify(payloadItems)}`;
  const resp = await callOpenRouterReasoning(
    config.deployments.reason,
    sys_p,
    usr_p,
    { max_completion_tokens: 1800, reasoning_effort: "low", temperature: (config as any).temperatures?.score ?? GLOBAL_CONFIG.temperature }
  );
  const data = parseJsonSafely(resp || "");
  let results: any[] = [];
  if (data && typeof data === "object" && Array.isArray(data.results)) results = data.results;
  else if (Array.isArray(data)) results = data;
  const out: ScoreBreakdown[] = [];
  for (const r of results) {
    if (!r || typeof r !== "object" || typeof r.index !== "number") continue;
    const rr: ScoreBreakdown = { index: r.index, Reasons: r.Reasons || {} };
    for (let i = 1; i <= 10; i++) {
      const key = `S${i}`;
      const val = parseFloat(String(r[key] ?? "0"));
      (rr as any)[key] = Number.isFinite(val) ? val : 0;
    }
    out.push(rr);
  }
  logJson("Batch Scores", out);
  return out;
};
export const enhanceIdea = async (
  brief: Brief,
  mentor_bio: string[],
  mentor_signature: string[],
  idea: Candidate,
  weak: Record<string, number>,
  config: Config = GLOBAL_CONFIG
): Promise<{ RevisedCrux?: Crux; RevisedDescription?: string; RevisedTitle?: string }> => {
  const sys_p = config.prompts.ENHANCE_SYSTEM;
  const usr_p = config.prompts.ENHANCE_USER
    .replace("{InterestAreas}", brief.InterestAreas)
    .replace("{SuitableFor}", brief.SuitableFor)
    .replace("{ProjectDuration}", String(brief.ProjectDuration))
    .replace("{ProjectGoal}", brief.ProjectGoal)
    .replace("{ProjectTypes}", (brief.ProjectTypes || ALLOWED_PRIMARY_TYPES).join(", "))
    .replace("{StudentTimeCommitment}", String(brief.StudentTimeCommitment))
    .replace("{CostForResources}", brief.CostForResources)
    .replace("{MentorBio}", renderMentorBioText(mentor_bio))
    .replace("{MentorSignature}", mentor_signature.join(", "))
    .replace("{CruxJSON}", JSON.stringify(idea.Crux))
    .replace("{ProjectDescription}", idea.ProjectDescription || "")
    .replace("{ProjectTitle}", idea.ProjectTitle || "")
    .replace("{WeakThreshold}", String(config.thresholds.weak_checkpoint))
    .replace("{WeakCheckpoints}", JSON.stringify(weak));
  const resp = await callOpenRouterReasoning(
    config.deployments.reason,
    sys_p,
    usr_p,
    { max_completion_tokens: 900, reasoning_effort: "low", temperature: (config as any).temperatures?.enhance ?? GLOBAL_CONFIG.temperature }
  );
  const data = parseJsonSafely(resp || "");
  return (data && typeof data === "object") ? data : {};
};

export const marketingPolish = async (
  brief: Brief,
  crux: Crux,
  title: string,
  description: string,
  config: Config = GLOBAL_CONFIG
): Promise<{ title: string; description: string }> => {
  const sys_p = config.prompts.MARKETING_SYSTEM;
  const usr_p = config.prompts.MARKETING_USER
    .replace("{InterestAreas}", brief.InterestAreas)
    .replace("{SuitableFor}", brief.SuitableFor)
    .replace("{ProjectDuration}", String(brief.ProjectDuration))
    .replace("{ProjectGoal}", brief.ProjectGoal)
    .replace("{StudentTimeCommitment}", String(brief.StudentTimeCommitment))
    .replace("{CostForResources}", brief.CostForResources)
    .replace("{CruxJSON}", JSON.stringify(crux))
    .replace("{ProjectTitle}", title)
    .replace("{ProjectDescription}", description);
  const gen = config.deployments.gen;
  const gen_full = config.deployments.gen_full || gen;
  let resp = await callOpenRouterChat(gen_full, sys_p, usr_p, { max_tokens: 650, temperature: (config as any).temperatures?.marketing ?? GLOBAL_CONFIG.temperature });
  if (!resp || !resp.trim()) {
    resp = await callOpenRouterChat(gen, sys_p, usr_p, { max_tokens: 650, temperature: (config as any).temperatures?.marketing ?? GLOBAL_CONFIG.temperature });
  }
  const obj = (parseJsonSafely(resp || "") || {}) as any;
  const new_title = String(obj?.MarketingTitle || title).replace(/:/g, "").trim();
  let new_desc = String(obj?.MarketingDescription || description).trim();
  const lines = new_desc.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 6) {
    const sents = new_desc.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    new_desc = (sents.length >= 6 ? sents : lines).join("\n");
  } else {
    new_desc = lines.slice(0, 12).join("\n");
  }
  return { title: new_title, description: new_desc };
};
// IMPORTANT: coerce inputs to string to avoid TypeError on non-string SuitableFor
export const deriveDifficulty = (
  suitable_for: any,
  method_text: any
): "Beginner" | "Intermediate" | "Advanced" => {
  const s = String(suitable_for ?? "").toLowerCase();
  const m = String(method_text ?? "").toLowerCase();
  if (s.includes("middle")) return "Beginner";
  if (s.includes("high")) {
    if (["python", "model", "kaggle", "neural", "regression", "simulation", "api", "fine-tune", "pipeline"].some((w) => m.includes(w))) {
      return "Intermediate";
    }
    return "Beginner";
  }
  if (s.includes("undergraduate") || s.includes("college")) {
    if (["neural", "optimization", "simulation", "statistical", "ml", "pipeline", "deployment", "inference"].some((w) => m.includes(w))) {
      return "Advanced";
    }
    return "Intermediate";
  }
  return "Beginner";
};


