import { callOpenRouterChat, callOpenRouterReasoning } from "../clients/openrouter";
import { FORMAT_LOCK, PROMPTS, CONFIG } from "../prompts";
import { WeekEntry, PlanSignatures } from "../types";

// Extract signatures from original description
export const extractPlanSignatures = async (description: string, agenda?: any): Promise<PlanSignatures> => {
  const system_prompt = PROMPTS.SIGNATURE_SYSTEM;
  const user_prompt = PROMPTS.SIGNATURE_USER
    .replace("{Description}", description)
    .replace("{Agenda}", agenda ? JSON.stringify(agenda, null, 2) : "None");

  const resp = await callOpenRouterReasoning(
    CONFIG.deployments.reason,
    system_prompt,
    user_prompt,
    { max_completion_tokens: 4000, reasoning_effort: "low", temperature: (CONFIG as any).temperatures?.signature ?? CONFIG.temperature }
  );

  try {
    return JSON.parse(resp || "{}");
  } catch (e) {
    return {
      ValuesLines: [],
      MustDeliverables: [],
      MustMetrics: [],
    };
  }
};

// Enrich a simple idea into a detailed project brief (keeps original header)
export const enrichProjectDescription = async (description: string, agenda?: any): Promise<string> => {
  const lines = description.trim().split(/\r?\n/);
  const title = lines[0] || "Untitled";
  const briefDesc = lines.length > 1 ? lines.slice(1).join("\n") : "";

  let agendaHint = "";
  if (agenda && Array.isArray(agenda) && agenda.length > 0) {
    try {
      const agendaTexts = agenda
        .filter((a: any) => a && typeof a === "object" && "description" in a)
        .map((a: any) => a.description)
        .slice(0, 10);
      if (agendaTexts.length > 0) {
        agendaHint = "\nAgenda hints (for internal guidance only):\n- " + agendaTexts.join("\n- ");
      }
    } catch (e) {
      // ignore agenda parsing errors
    }
  }

  const system_prompt = PROMPTS.ENRICH_SYSTEM;
  const user_prompt = PROMPTS.ENRICH_USER
    .replace("{Title}", title)
    .replace("{BriefDesc}", briefDesc)
    .replace("{AgendaHint}", agendaHint);

  const enriched = await callOpenRouterReasoning(
    CONFIG.deployments.reason,
    system_prompt,
    user_prompt,
    { max_completion_tokens: 4000, reasoning_effort: "low", temperature: (CONFIG as any).temperatures?.session_enrich ?? CONFIG.temperature }
  );

  if (!enriched) return description;

  if (lines.length > 1) {
    const header = lines.slice(0, 2).join("\n"); // first two lines: title + dates
    return `${header}\n${enriched.trim()}`;
  } else {
    return `${lines[0]}\n${enriched.trim()}`;
  }
};

// Extract dates "Aug 22, 2025 to Nov 14, 2025" or "August 22 2025 to November 14 2025"
export const extractDates = (description: string): { start?: Date; end?: Date } => {
  if (!description) return {};
  const text = description.replace(/[“”]/g, '"').trim();
  const m = text.match(/([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})\s+to\s+([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/i);
  if (!m) return {};
  const [, a, b] = m;
  const normalize = (s: string) => s.replace(",", "");
  const tryParse = (s: string) => {
    const d = new Date(normalize(s));
    return isNaN(d.getTime()) ? undefined : d;
  };
  const start = tryParse(a);
  const end = tryParse(b);
  return { start, end };
};

// Weekly schedule (if missing dates, default N weeks starting today)
export const weeklySessionDates = (start?: Date, end?: Date, defaultWeeks = 12): WeekEntry[] => {
  const out: WeekEntry[] = [];
  if (!start || !end) {
    const base = new Date();
    for (let i = 0; i < defaultWeeks; i++) {
      const d = new Date(base.getTime());
      d.setDate(d.getDate() + i * 7);
      out.push({ week: i + 1, dateStr: fmtWeekdate(d) });
    }
    return out;
  }
  let d = new Date(start.getTime());
  let wk = 1;
  while (d.getTime() < end.getTime()) {
    out.push({ week: wk, dateStr: fmtWeekdate(d) });
    wk += 1;
    d.setDate(d.getDate() + 7);
  }
  return out;
};

export const fmtWeekdate = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" });

// Build draft-generation prompt
export const buildGenerationPrompt = (
  projectTitle: string,
  projectDescription: string,
  schedule: WeekEntry[],
  hoursMap: Record<number | "default", number>,
  finalHours: number | null | undefined,
  tone: string,
  signatures: PlanSignatures,
  agenda?: any
) => {
  const lines: string[] = [];
  lines.push(PROMPTS.DRAFT_SYSTEM.replace("{Tone}", tone));
  lines.push(FORMAT_LOCK);
  lines.push("");
  lines.push("Project Brief (stay strictly within this scope):");
  lines.push(projectDescription.trim());
  lines.push("");

  // Add agenda hints if available
  if (agenda && Array.isArray(agenda)) {
    try {
      const agendaTexts = agenda
        .filter((a: any) => a && typeof a === "object" && "description" in a)
        .map((a: any) => a.description)
        .slice(0, 12);
      if (agendaTexts.length > 0) {
        lines.push("Agenda hints (use as internal guidance only; do not print):");
        lines.push("- " + agendaTexts.join("\n- "));
        lines.push("");
      }
    } catch (e) {
      // ignore agenda parsing errors
    }
  }

  // Add must-include signatures
  lines.push("Must-Include Signatures (include succinctly in appropriate weeks and final sections):");
  if (signatures.ValuesLines && signatures.ValuesLines.length > 0) {
    lines.push("Values/Implications Lines:");
    for (const v of signatures.ValuesLines) {
      lines.push(`- ${v}`);
    }
  }
  if (signatures.MustDeliverables && signatures.MustDeliverables.length > 0) {
    lines.push("Required Deliverables:");
    for (const d of signatures.MustDeliverables) {
      lines.push(`- ${d}`);
    }
  }
  if (signatures.MustMetrics && signatures.MustMetrics.length > 0) {
    lines.push("Required Metrics:");
    for (const m of signatures.MustMetrics) {
      lines.push(`- ${m}`);
    }
  }

  lines.push("");
  lines.push("General constraints (content, not formatting):");
  lines.push("- Do not introduce new domains or expensive tools not implied by the brief.");
  lines.push("- Use at most 2–4 mainstream tools if truly needed; prefer free or familiar ones.");
  lines.push("- Focus on one coherent artifact/outcome; keep tasks concrete and measurable.");
  lines.push("- If a visible milestone is natural, place it by Week 2–3 (keep it true to the brief).");
  lines.push("");
  lines.push("Schedule (use internally; DO NOT print dates, only 'Week N'):");
  for (const { week, dateStr } of schedule) {
    lines.push(`- Week ${week}: ${dateStr}`);
  }
  lines.push("");
  lines.push("Hours per week (must match totals):");
  const totalWeeks = schedule.length;
  for (const { week } of schedule) {
    let h = hoursMap[week] ?? hoursMap["default"] ?? 4;
    if (finalHours && week === totalWeeks) h = finalHours;
    lines.push(`- Week ${week}: ${h}`);
  }
  lines.push("");
  lines.push("Now output the full multi-week plan in the exact schema above.");
  return lines.join("\n");
};

// Build synthesis prompt
export const buildSynthesisPrompt = (
  projectTitle: string,
  combinedDrafts: string,
  schedule: WeekEntry[],
  hoursMap: Record<number | "default", number>,
  finalHours: number | null | undefined,
  signatures: PlanSignatures
) => {
  const totalWeeks = schedule.length;
  const lines: string[] = [];
  lines.push(PROMPTS.SYNTH_SYSTEM);
  lines.push(PROMPTS.SYNTH_USER
    .replace("{TotalWeeks}", String(totalWeeks))
    .replace("{Signatures}", formatSignaturesForPrompt(signatures))
    .replace("{FormatLock}", FORMAT_LOCK)
    .replace("{Schedule}", schedule.map(({ week, dateStr }) => `- Week ${week}: ${dateStr}`).join("\n"))
    .replace("{Hours}", schedule.map(({ week }) => {
      let h = hoursMap[week] ?? hoursMap["default"] ?? 4;
      if (finalHours && week === totalWeeks) h = finalHours;
      return `- Week ${week}: ${h}`;
    }).join("\n"))
    .replace("{CombinedDrafts}", combinedDrafts)
  );
  return lines.join("\n");
};

// Helper function to format signatures for prompts
const formatSignaturesForPrompt = (signatures: PlanSignatures): string => {
  const lines: string[] = [];
  if (signatures.ValuesLines && signatures.ValuesLines.length > 0) {
    lines.push("Values/Implications Lines:");
    for (const v of signatures.ValuesLines) {
      lines.push(`- ${v}`);
    }
  }
  if (signatures.MustDeliverables && signatures.MustDeliverables.length > 0) {
    lines.push("Required Deliverables:");
    for (const d of signatures.MustDeliverables) {
      lines.push(`- ${d}`);
    }
  }
  if (signatures.MustMetrics && signatures.MustMetrics.length > 0) {
    lines.push("Required Metrics:");
    for (const m of signatures.MustMetrics) {
      lines.push(`- ${m}`);
    }
  }

  return lines.join("\n");
};

// Validation and repair

export const planNeedsRepair = (planText: string): string => {
  if (!planText || !planText.trim()) return "Plan is empty.";
  if (!planText.includes("Final Outcome:")) return "Missing 'Final Outcome' section.";
  if (!planText.includes("Skills You'll Learn:")) return "Missing 'Skills You'll Learn' section.";

  const weekBlocks = planText.trim().split(/\n(?=Week\s+\d+:)/);
  if (!weekBlocks.some((blk) => blk.trim().startsWith("Week"))) return "No week blocks found.";

  for (const blk of weekBlocks) {
    if (!blk.trim().startsWith("Week")) continue;

    const mHdr = blk.match(/^Week\s+(\d+):.*\((\d+(?:\.\d+)?)\s*hours?\)/im);
    if (!mHdr) {
      const wt = blk.match(/^Week\s+(\d+):/m);
      if (wt) {
        const weekNum = wt[1];
        return `Malformed week header in Week ${weekNum} (missing hours).`;
      }
      continue;
    }
    const weekNum = mHdr[1];
    const H = parseFloat(mHdr[2]);

    const taskHours = Array.from(blk.matchAll(/[—-]\s*([\d\.]+)\s*hr\.?/g)).map((m) => parseFloat(m[1]));
    const mTime = blk.match(/^Time:\s*(.+)$/m);
    if (!mTime) return `Missing 'Time:' line in week ${weekNum}.`;

    const timeHoursStr = mTime[1];
    const timeHours = Array.from(timeHoursStr.matchAll(/(\d+(?:\.\d+)?)\s*hr/g)).map((m) => parseFloat(m[1]));

    if (!taskHours.length && H > 0) return `Missing task durations in week ${weekNum}.`;
    if (!timeHours.length && H > 0) return `Missing durations in 'Time:' line for week ${weekNum}.`;

    const sumTasks = Math.round(taskHours.reduce((a, b) => a + b, 0) * 2) / 2;
    const sumTime = Math.round(timeHours.reduce((a, b) => a + b, 0) * 2) / 2;
    const H_rnd = Math.round(H * 2) / 2;

    if (sumTasks !== H_rnd || sumTime !== H_rnd) {
      return `Hour mismatch in week ${weekNum} (tasks total ${sumTasks}, time total ${sumTime}, header H ${H_rnd}).`;
    }
  }
  return "";
};

export const repairWithReasoning = async (badPlan: string, reason: string, totalWeeks: number): Promise<string | null> => {
  const system_prompt = PROMPTS.REPAIR_SYSTEM.replace("{TotalWeeks}", String(totalWeeks));
  const user_prompt = PROMPTS.REPAIR_USER
    .replaceAll("{Reason}", reason)
    .replaceAll("{TotalWeeks}", String(totalWeeks))
    .replace("{BadPlan}", badPlan);

  return callOpenRouterReasoning(
    CONFIG.deployments.reason,
    system_prompt,
    user_prompt,
    { max_completion_tokens: 4000, reasoning_effort: "low", temperature: (CONFIG as any).temperatures?.session_repair ?? CONFIG.temperature }
  );
};

// Check if plan is missing required signatures
export const planMissingSignatures = (planText: string, signatures: PlanSignatures): string[] => {
  const missing: string[] = [];
  const p = (planText || "").toLowerCase();

  // Values lines (look for presence of words like implications, ethics, responsible, societal, limitations, fairness, privacy)
  if (signatures.ValuesLines && signatures.ValuesLines.length > 0) {
    const hasValues = signatures.ValuesLines.some(line => 
      line.split(" ").slice(0, 2).some(word => p.includes(word.toLowerCase()))
    );
    if (!hasValues) {
      missing.push("Add 1–2 Values/Implications lines reflecting the description (ethics, societal impact, limitations).");
    }
  }

  // Required deliverables
  for (const d of signatures.MustDeliverables || []) {
    if (d && !p.includes(d.toLowerCase())) {
      missing.push(`Add deliverable: ${d}`);
    }
  }

  // Required metrics
  for (const m of signatures.MustMetrics || []) {
    if (m && !p.includes(m.toLowerCase())) {
      missing.push(`Add metric mention: ${m}`);
    }
  }


  return missing;
};

// Patch missing signatures with minimal changes
export const patchSignaturesWithReasoning = async (
  planText: string, 
  totalWeeks: number, 
  missingItems: string[]
): Promise<string | null> => {
  if (missingItems.length === 0) return planText;

  const system_prompt = PROMPTS.PATCH_SYSTEM.replace("{TotalWeeks}", String(totalWeeks));
  const user_prompt = PROMPTS.PATCH_USER
    .replace("{TotalWeeks}", String(totalWeeks))
    .replace("{MissingItems}", missingItems.join("\n- "))
    .replace("{Plan}", planText);

  return callOpenRouterReasoning(
    CONFIG.deployments.reason,
    system_prompt,
    user_prompt,
    { max_completion_tokens: 4000, reasoning_effort: "low", temperature: (CONFIG as any).temperatures?.session_patch ?? CONFIG.temperature }
  );
};
