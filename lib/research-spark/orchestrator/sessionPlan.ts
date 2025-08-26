import {
    DEFAULT_TONES,
    DEFAULT_WEEKS_IF_MISSING_DATES,
    DEFAULT_HOURS_MAP,
    DEFAULT_FINAL_WEEK_HOURS_IF_8_PLUS,
    PROMPTS,
  } from "../prompts";
  import { GenerateSessionPlanOptions } from "../types";
  import {
    enrichProjectDescription,
    extractPlanSignatures,
    extractDates,
    weeklySessionDates,
    buildGenerationPrompt,
    buildSynthesisPrompt,
    planNeedsRepair,
    repairWithReasoning,
    planMissingSignatures,
    patchSignaturesWithReasoning,
  } from "../llm/llm_session";
  import { callOpenRouterChat, callOpenRouterReasoning } from "../clients/openrouter";
  import { CONFIG } from "../prompts";
  import { logSection } from "../utils/log";
  
  export const generateSessionPlan = async (
    project_description: string,
    options?: GenerateSessionPlanOptions
  ): Promise<string> => {
    const printDrafts = !!options?.printDrafts;
    const tones = options?.tones || DEFAULT_TONES;
    const hoursMap = options?.hoursMap || DEFAULT_HOURS_MAP;
    const defaultWeeks = options?.defaultWeeksIfMissingDates ?? DEFAULT_WEEKS_IF_MISSING_DATES;
    const finalWeekHoursIf8Plus = options?.finalWeekHoursIf8Plus ?? DEFAULT_FINAL_WEEK_HOURS_IF_8_PLUS;
    const agenda = (options as any)?.agenda;
  
    // Check env for OpenRouter keys and deployments
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("Missing OPENROUTER_API_KEY in environment");
    }
        const genDeployment = CONFIG.deployments.gen;
    const reasonDeployment = CONFIG.deployments.reason;

    // Step 1: Extract signatures from ORIGINAL description (not enriched)
    console.log("[INFO] Extracting signatures from original description...");
    const signatures = await extractPlanSignatures(project_description, agenda);
    console.log("[INFO] Extracted Signatures:");
    console.log(JSON.stringify(signatures, null, 2));

    // Step 2: Enrichment
    console.log("[INFO] Enriching project description with technical details...");
    const enriched = await enrichProjectDescription(project_description, agenda);
    logSection("Using enriched brief for plan generation");
    console.log(enriched);
  
    // Extract context from enriched description
    const { start, end } = extractDates(enriched);
    const firstLine = enriched.trim().split(/\r?\n/)[0]?.replace(/^[“"]|[”"]$/g, "").trim() || "Untitled Project";
    const schedule = weeklySessionDates(start, end, defaultWeeks);
    const totalWeeks = schedule.length;
  
    // default final week hours
    const finalHours = totalWeeks >= 8 ? finalWeekHoursIf8Plus : null;
  
    // Step 1: Generate diverse drafts
    logSection("STEP 1: Generating drafts");
    const drafts: string[] = [];
    const draftSystem = PROMPTS.DRAFT_SYSTEM.replace("{TotalWeeks}", String(totalWeeks));
  
    for (let idx = 0; idx < tones.length; idx++) {
      const tone = tones[idx];
      const genPrompt = buildGenerationPrompt(firstLine, enriched, schedule, hoursMap, finalHours, tone, signatures, agenda);
      console.log(`--- Calling gen draft ${idx + 1} (${tone}) ---`);
      const draft = await callOpenRouterChat(
        genDeployment,
        draftSystem,
        genPrompt,
        { temperature: (CONFIG as any).temperatures?.session_draft ?? CONFIG.temperature, max_tokens: 4000 }
      );
      if (!draft) throw new Error("Draft generation failed.");
      drafts.push(draft);
      if (printDrafts) {
        console.log(`\n[DRAFT ${idx + 1}] ================================\n${draft}\n============================================\n`);
      }
    }
  
    // Step 2: Synthesize with reasoning model
    logSection("STEP 2: Synthesizing with reasoning model");
    const combined = drafts.map((d, i) => `DRAFT ${i + 1}:\n${d}`).join("\n\n--- DRAFT SEPARATOR ---\n\n");
    const synthPrompt = buildSynthesisPrompt(firstLine, combined, schedule, hoursMap, finalHours, signatures);
    const synthSystem = PROMPTS.SYNTH_SYSTEM.replace("{TotalWeeks}", String(totalWeeks));
  
    let finalPlan = await callOpenRouterReasoning(
      reasonDeployment,
      synthSystem,
      synthPrompt,
      { reasoning_effort: "low", max_completion_tokens: 4000, temperature: (CONFIG as any).temperatures?.session_synth ?? CONFIG.temperature }
    );
    if (!finalPlan) throw new Error("Synthesis failed.");
  
    // Step 3: Validate & repair formatting if needed
    let reason = planNeedsRepair(finalPlan);
    let attempts = 0;
    while (reason && attempts < 2) {
      attempts += 1;
      console.log(`[INFO] Plan needs formatting repair (${reason}). Asking reasoning model to fix...`);
      const repaired = await repairWithReasoning(finalPlan, reason, totalWeeks);
      if (!repaired) {
        console.warn("[WARN] Repair attempt returned no content. Halting.");
        break;
      }
      finalPlan = repaired;
      reason = planNeedsRepair(finalPlan);
    }
  
    // Step 6: Ensure signatures are present; minimally patch if some are missing
    const missingSigItems = planMissingSignatures(finalPlan || "", signatures);
    if (missingSigItems.length > 0) {
      console.log("[INFO] Some description-derived signatures are missing; adding minimal lines while preserving schema...");
      const patched = await patchSignaturesWithReasoning(finalPlan || "", totalWeeks, missingSigItems);
      if (patched) {
        finalPlan = patched;
      }
    }

    // Final validation
    reason = planNeedsRepair(finalPlan);
    if (reason) {
      console.warn(`[WARN] Could not fully repair formatting after ${attempts} attempt(s). Returning best-effort plan.`);
      console.warn(`Final formatting issue: ${reason}`);
      console.warn("\n--- FINAL (BEST-EFFORT) OUTPUT ---");
      console.warn(finalPlan);
      return finalPlan;
    }
  
    logSection("FINAL OUTPUT: Polished Session Plan");
    console.log(finalPlan);
    return finalPlan;
  };
  