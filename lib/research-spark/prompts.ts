// Env loading is handled by the Next.js runtime or the host process.

export const ALLOWED_PRIMARY_TYPES = [
  "Experimental Science Project",
  "Survey-Based Research",
  "AI/Kaggle Dataset Project",
  "Literature Review",
  "Math Modeling / Simulation",
  "No-Code App / Prototype",
  "Prompt Engineering / AI Creativity",
  "Interview / Oral History Project",
  "Ethics / Policy Project",
  "Awareness Campaign",
] as const;

export type AllowedType = typeof ALLOWED_PRIMARY_TYPES[number];

export interface Config {
  deployments: {
    gen: string;
    gen_full: string;
    reason: string;
  };
  // Central temperature knob applied to all LLM calls (chat + reasoning)
  temperature: number;
  // Per-step temperatures to fine-tune behavior
  temperatures: {
    signature: number;
    crux: number;
    desc: number;
    title: number;
    diverse: number; // reasoning
    marketing: number;
    score: number; // reasoning
    enhance: number; // reasoning
    session_enrich: number; // reasoning
    session_draft: number;
    session_synth: number; // reasoning
    session_repair: number; // reasoning
    session_patch: number; // reasoning
  };
  counts: {
    crux_generate_N: number;
    select_M: number;
    winners_k: number;
  };
  thresholds: {
    final_score: number;
    weak_checkpoint: number;
    max_enhance: number;
    prefilter_min_score: number;
  };
  prompts: Record<string, string>;
  verbose?: boolean;
}

export const CONFIG: Config = {
  deployments: {
    gen: "openai/gpt-4.1-mini",
    gen_full: "openai/gpt-4.1",
    reason: "openai/o3-mini",
  },
  temperature: 0.6,
  temperatures: {
    signature: 0.2,
    crux: 0.7,
    desc: 0.6,
    title: 0.5,
    diverse: 0.0,
    marketing: 0.6,
    score: 0.0,
    enhance: 0.3,
    session_enrich: 0.2,
    session_draft: 0.6,
    session_synth: 0.2,
    session_repair: 0.0,
    session_patch: 0.0,
  },
  counts: {
    crux_generate_N: 8,
    select_M: 4,
    winners_k: 2,
  },
  thresholds: {
    final_score: 90.0,
    weak_checkpoint: 8.7,
    max_enhance: 3,
    prefilter_min_score: 70.0,
  },
  prompts: {
    SIGNATURE_SYSTEM: `You analyze a mentor's bio and extract a compact "signature".
Return only a JSON array (10–20 items) of short tokens that capture expertise areas, tools, verbs, deliverables, tone, and recurring motifs.
Avoid copying multi-word phrases longer than 3–4 words. No explanations, only the JSON array.`,
    SIGNATURE_USER: `MentorBio (bullet list; each item is a sentence/phrase):
{MentorBio}
Rules:
- Return 10–20 tokens (e.g., "google colab", "design thinking", "visual demo", "survey", "kaggle", "poster", "paper", "prototyping", "healthcare", "edge ai").
- JSON array only, no extra text.`,
    CRUX_SYSTEM: `You are a master mentor who creates student projects that students and parents want to enroll in.
Design ideas this mentor would plausibly supervise next, based on the mentor's bio. Do not invent capabilities far beyond the bio.
Constraints:
- Use exactly one PrimaryType per idea (must be in the allowed list).
- Cost, time, and level must match the brief exactly.
- Tools must be 2–4 items, favor widely used platforms; subscriptions are okay if budget allows.
- Include a specific dataset/resource/platform when relevant (prefer free/public).
- EarlyWow must be a concrete, parent-visible milestone achievable by Week 2 or Week 3.
Output only a JSON array of crux objects, no extra text.`,
    CRUX_USER: `DesignBrief:
InterestAreas: {InterestAreas}
SuitableFor: {SuitableFor}
ProjectDuration: {ProjectDuration} weeks
ProjectGoal: {ProjectGoal}
ProjectTypes (allowed or preferred): {ProjectTypes}
StudentTimeCommitment: {StudentTimeCommitment} hr/week
CostForResources: {CostForResources}

MentorBio (bullet list; guide scope and credibility; do not over-claim beyond these strengths):
{MentorBio}

MentorSignature (style hints, not for copying claims): {MentorSignature}

Rules:
- Keep the idea aligned with the mentor's bio strengths; avoid over-claiming.
- Use ONE PrimaryType from this list only: [{AllowedTypes}]
- CostBracket must be one of: ["<$100", "<$200", "<$500"] and within {CostForResources}.
- Ensure a specific EarlyWow milestone by Week 2 or Week 3 (mention the week).
- TimePlan must exactly match: {ProjectDuration} weeks, {StudentTimeCommitment} hr/week.
- Tools: 2–4 items only.

Output JSON array where each object has keys:
PrimaryType, CoreIdea, Artifact, Method, DataOrResources, Tools, EarlyWow, CostBracket, TimePlan, SuitableFor, GoalDeliverable`,
    DESC_SYSTEM: `You write crisp, student and parent-friendly project descriptions with zero fluff.
Rules:
- 3–5 sentences total.
- Order: Hook; What you’ll build; Why it matters; How you’ll do it; Showcase.
- Include the EarlyWow milestone implicitly or explicitly by Week 2–3.
- Clear, tangible, safe. Avoid jargon walls. Prefer concrete tools/datasets.
- Respect all DesignBrief constraints (time, cost, level).
Output only the description string (no quotes).`,
    DESC_USER: `DesignBrief:
InterestAreas: {InterestAreas}
SuitableFor: {SuitableFor}
ProjectDuration: {ProjectDuration} weeks
ProjectGoal: {ProjectGoal}
ProjectTypes: {ProjectTypes}
StudentTimeCommitment: {StudentTimeCommitment} hr/week
CostForResources: {CostForResources}

Crux:
PrimaryType: {PrimaryType}
CoreIdea: {CoreIdea}
Artifact: {Artifact}
Method: {Method}
DataOrResources: {DataOrResources}
Tools: {Tools}
EarlyWow: {EarlyWow}
CostBracket: {CostBracket}
TimePlan: {TimePlan}
SuitableFor: {SuitableFor}
GoalDeliverable: {GoalDeliverable}`,
    TITLE_SYSTEM: `You craft concise, energetic titles (4–7 words, no colon).
Include a strong verb or the artifact. Avoid clichés and generic terms like "Project" or "Study".
Output a single title string (no quotes).`,
    TITLE_USER: `Description: {ProjectDescription}
PrimaryType: {PrimaryType}
Emphasize the artifact or the “why.” Fit for {SuitableFor}.`,
    DIVERSE_SYSTEM: `You are a curator optimizing diversity and quality from a candidate list of cruxes.
Goal: pick a subset that maximizes diversity (PrimaryType variety and distinct CoreIdea directions) while keeping high quality.
Return JSON only:
{ "SelectedIndices": [int, int, ...], "Reasons": "short note" }`,
    DIVERSE_USER: `You are given an array of crux objects with their index in the array.
Pick exactly {M} indices that represent the most diverse and high-quality set.
Focus on:
- Covering different PrimaryTypes where possible
- Avoiding similar CoreIdea phrasing
- Preferring ones with strong EarlyWow and tangible Artifact

Candidates (index: crux):
{IndexedCruxJSON}`,
    MARKETING_SYSTEM: `You are a senior education growth copywriter + technical PM for a tutoring/mentoring academy. Your goal is to maximize enrollments while preserving the project’s original scope and constraints.

Do-not-change constraints:

Do NOT change PrimaryType, core idea/scope, SuitableFor level, TimePlan, or CostBracket.
Keep tools/datasets/platforms within the budget and scope already implied.
No medical/financial guarantees; keep claims educational and responsible.
Title requirements:

5–9 words. No colon. Avoid generic “Project/Study.”
Energetic, benefit-forward. Include artifact or outcome (e.g., “AI Tumor Classifier,” “Drone Seed Dropper,” “Full-Stack Impact App”).
Description requirements (10–15 single lines, each on its own line; no bullets or numbering):

A strong hook for teens and supportive parents (impact, pride, relevance). 2–3) What the student will actually build (artifact/app/model/device) and why it matters.
EarlyWow milestone by Week 2 or Week 3 (explicitly mention the week and the tangible outcome).
Hardware stack (if relevant): name boards, sensors, actuators, camera modules, or kits. If software-only, write “Software-only stack” and list the core components.
Software/ML stack: frameworks, model families, libraries, cloud/services (e.g., PyTorch/TensorFlow, XGBoost, BERT/CNN/YOLO, Firebase/Auth, REST APIs).
Data sources/APIs/datasets: name specific datasets, APIs, or repositories (e.g., Kaggle dataset names, OpenFDA, Charity Navigator API, NASA API).
Build/process plan: X weeks and Y hr/week, with a short “how we’ll do it” (e.g., EDA → model → deployment; research → prototype → test).
Safety/ethics/compliance line (e.g., FAA-safe flight area; eye-safe testing; no medical claims; COPPA-friendly).
Budget fit line: CostBracket and 2–4 likely spend items (kits, hosting, sensors, printing).
Showcase/deliverables: demo video, GitHub repo, Figma prototype, Kaggle submission, poster, live app/site.
College/resume/competition value: concrete outcomes (portfolio keywords, competition readiness, presentation/paper). 13–14) Skills gained with domain-correct jargon (e.g., CNN segmentation, SHAP explainability, OAuth2, WebSockets, edge inference, PID tuning).
Close with confident promise of a visible, pride-worthy artifact (credible, no overclaiming).
Voice and style:

High-energy, concrete, jargon-friendly but readable to parents; short lines (aim ≤18 words).
Use powerful verbs and domain-accurate terms; zero fluff; crisp, specific nouns.
Do not introduce new expensive components or unsafe practices.
If health-related: explicitly educational prototype, not a diagnostic device.
Output JSON only:
{
"MarketingTitle": "string, 5–9 words, no colon",
"MarketingDescription": "string with 10–15 lines separated by newline characters"
}`,
    MARKETING_USER: `DesignBrief:
InterestAreas: {InterestAreas}
SuitableFor: {SuitableFor}
ProjectDuration: {ProjectDuration} weeks
ProjectGoal: {ProjectGoal}
StudentTimeCommitment: {StudentTimeCommitment} hr/week
CostForResources: {CostForResources}

Crux (do not change core scope, PrimaryType, or constraints):
{CruxJSON}

Current Title: {ProjectTitle}
Current Description:
{ProjectDescription}

Please return JSON only:
{
"MarketingTitle": "string (5–9 words, no colon)",
"MarketingDescription": "string with 6–10 lines separated by line breaks"
}`,
    SCORE_SYSTEM: `You are a strict, calibrated reviewer. Score each checkpoint 0.0–10.0 (decimals allowed).
Use a regressive curve:
- 9.5–10: Exceptional, clearly evidenced in the idea with explicit details matched to the brief.
- 8.5–9.4: Strong, minor polish needed.
- 7.0–8.4: Adequate, noticeable issues or vagueness (DEFAULT unless strong evidence).
- 4.0–6.9: Weak or partially misaligned.
- 0.0–3.9: Critically flawed or off-brief.

Return JSON only with fields: S1..S10 (numbers), plus short Reasons for each (Reasons.S1..Reasons.S10).
Scoring dimensions:
S1 Interest Fit
S2 SuitableFor Fit
S3 Duration Fit (scope, Week 2–3 EarlyWow, finish line)
S4 Goal Fit (clear path to ProjectGoal and realistic deliverable/venue)
S5 ProjectType Coherence (exactly one PrimaryType; not khichified)
S6 Time Fit (matches StudentTimeCommitment; realistic implied effort)
S7 Cost Fit (under CostForResources; free tools emphasized)
S8 Parent/Student Appeal (hook + pride-worthy artifact, agency)
S9 Originality within mentor's domain (based on bio; fresh angle, not generic)
S10 Mentor-Think Plausibility (style alignment using signature hints without copying)
Be conservative; prefer 7.x unless strong evidence merits 8.5+.`,
    SCORE_USER: `DesignBrief:
InterestAreas: {InterestAreas}
SuitableFor: {SuitableFor}
ProjectDuration: {ProjectDuration} weeks
ProjectGoal: {ProjectGoal}
ProjectTypes: {ProjectTypes}
StudentTimeCommitment: {StudentTimeCommitment} hr/week
CostForResources: {CostForResources}

MentorSignature (hints): {MentorSignature}
MentorBio:
{MentorBio}

Idea:
Crux: {CruxJSON}
Description: {ProjectDescription}
Title: {ProjectTitle}

Output JSON:
{
"S1": number, "S2": number, "S3": number, "S4": number, "S5": number, "S6": number, "S7": number, "S8": number, "S9": number, "S10": number,
"Reasons": {
        "S1":"...", "S2":"...", "S3":"...", "S4":"...", "S5":"...", "S6":"...", "S7":"...", "S8":"...", "S9":"...", "S10":"..."
}
}`,
    ENHANCE_SYSTEM: `You improve the crux first, then regenerate the description and title.
Raise only the weak checkpoints while keeping all constraints:
- Keep PrimaryType unchanged.
- Keep TimePlan and CostBracket within the DesignBrief.
- Maintain SuitableFor level.
- Stay consistent with MentorBio; do not over-claim beyond domain strengths.
Target ≥ 9.0 for weak checkpoints if feasible.
Output JSON with keys: RevisedCrux, RevisedDescription, RevisedTitle.`,
    ENHANCE_USER: `DesignBrief:
InterestAreas: {InterestAreas}
SuitableFor: {SuitableFor}
ProjectDuration: {ProjectDuration} weeks
ProjectGoal: {ProjectGoal}
ProjectTypes: {ProjectTypes}
StudentTimeCommitment: {StudentTimeCommitment} hr/week
CostForResources: {CostForResources}

MentorBio (for alignment; do not over-claim):
{MentorBio}

MentorSignature (hints): {MentorSignature}

Current Idea:
Crux: {CruxJSON}
Description: {ProjectDescription}
Title: {ProjectTitle}

Weak Checkpoints (scores < {WeakThreshold}, with reasons): {WeakCheckpoints}

Please:
- Sharpen CoreIdea and EarlyWow (explicit Week 2 or Week 3 milestone).
- Ensure single-scope clarity (not khichified).
- Improve artifact clarity and parent appeal (concrete, pride-worthy).
- Keep cost/time/level fixed.

Return JSON: { "RevisedCrux": {}, "RevisedDescription": "...", "RevisedTitle": "..." }`,
  },
  verbose: (process.env.VERBOSE_LOG || "1").trim() !== "0",
};


// -------------------session plan ----------------------


export const FORMAT_LOCK = `MUST FOLLOW THIS EXACT OUTPUT SCHEMA:

Week {N}: {Title} ({H} hours)
Objective: {one clear sentence}.
Tasks:
- {Task A label} — {x} hr.
- {Task B label} — {y} hr.
- {Task C label} — {z} hr.
- {Task D label} — {w} hr.   # include either 3 or 4 task lines total
Deliverables: {comma-separated}.
Time: {Task A label} {x} hr; {Task B label} {y} hr; {Task C label} {z} hr[; {Task D label} {w} hr] (Total: {H} hr)

[Repeat the week block for all weeks 1..N, where N = number of weeks in the schedule provided.]

Final Outcome:
- {bullet 1 grounded in this project’s brief}
- {bullet 2 grounded in this project’s brief}
- {bullet 3 grounded in this project’s brief}
- {bullet 4 grounded in this project’s brief}

Skills You'll Learn:
- {skill 1 grounded in this project’s brief}
- {skill 2 grounded in this project’s brief}
- {skill 3 grounded in this project’s brief}
- {skill 4 grounded in this project’s brief}

Rules:
- Produce EXACTLY N week blocks where N is the number of dates in the schedule I provided; week numbers must be contiguous (1..N). DO NOT invent extra weeks.
- Do NOT print calendar dates anywhere. Use only “Week N”.
- Every task line ends with “— {number} hr.” using 0.5-hour granularity. Use “hr” (singular) exactly; never “hrs”, “hour(s)”, or minutes.
- The “Time:” line MUST mirror the task labels in the same order and durations, and must end with “(Total: {H} hr)”. If task durations don’t sum to {H}, adjust minimally so they do.
- Use present-tense, action verbs, and concrete artifacts for Deliverables (comma-separated nouns; no final period).
- Ground all content (including Final Outcome and Skills) in the project brief provided; avoid generic platitudes.
- Output ONLY the plan (no preface, no afterword, no extra headings).
`;

export const PROMPTS = {
  // Signature extraction from original description
  SIGNATURE_SYSTEM: `You extract concrete 'must-include signatures' from a project description and optional agenda. 
Return only a JSON object with keys: ValuesLines, MustDeliverables, MustMetrics.
Rules: use only what is explicitly present or strongly implied in the description; do not introduce unrelated domains/tools. 
ValuesLines should be 3–6 short lines about societal/ethical/usage implications relevant to the description. `,
  
  SIGNATURE_USER: `Original Description:
{Description}

Agenda (optional; treat as hints only):
{Agenda}

Output JSON example:
{
  "ValuesLines": ["...","..."],
  "MustDeliverables": ["...","..."],
  "MustMetrics": ["..."],
}`,

  // Enhanced enrichment
  ENRICH_SYSTEM: `You are an expert curriculum designer. Expand the idea into a realistic, student-completable brief (6–12 weeks). 
Stay strictly within the original scope and audience; do not introduce new modalities or unrelated technologies. 
If the brief mentions tools or methods, reflect them; otherwise, select at most 2–4 lightweight, mainstream tools 
that naturally fit. Keep focus on a single coherent artifact or outcome. Be concrete and concise.`,
  
  ENRICH_USER: `Title: {Title}

Original Idea (preserve goal and audience; keep scope tight):
{BriefDesc}

Constraints:
- Do NOT add unrelated domains (e.g., hardware/AI if not mentioned).
- Use 2–4 plausible tools consistent with the idea (only if needed).
- Describe ONE artifact and the system logic (inputs → processing → outputs).
- Keep assumptions realistic; avoid scope creep.

{AgendaHint}

Output ONLY one enriched paragraph (≈160–220 words). No title, no dates, no lists.`,

  // Enhanced draft generation
  DRAFT_SYSTEM: `You are a creative curriculum designer. Adopt a '{Tone}' tone BUT obey the format strictly.`,
  
  DRAFT_USER: `{FormatLock}

Project Brief (stay strictly within this scope):
{ProjectDescription}

{AgendaHints}

Must-Include Signatures (include succinctly in appropriate weeks and final sections):
{Signatures}

General constraints (content, not formatting):
- Do not introduce new domains or expensive tools not implied by the brief.
- Use at most 2–4 mainstream tools if truly needed; prefer free or familiar ones.
- Focus on one coherent artifact/outcome; keep tasks concrete and measurable.
- If a visible milestone is natural, place it by Week 2–3 (keep it true to the brief).

Schedule (use internally; DO NOT print dates, only 'Week N'):
{Schedule}

Hours per week (must match totals):
{Hours}

Now output the full multi-week plan in the exact schema above.`,

  // Enhanced synthesis
  SYNTH_SYSTEM: `You are an expert curriculum editor and formatter.`,
  
  SYNTH_USER: `Task: Synthesize the 5 drafts into ONE final plan with exactly {TotalWeeks} week blocks.
Keep the exact output structure and hours. Prefer clarity, concreteness, and alignment with the brief.
Remove duplications across drafts. Keep a single coherent artifact and measurable tasks/deliverables.

Retain the following Must-Include Signatures from the description:
{Signatures}

{FormatLock}

Schedule (internal only; generate all {TotalWeeks} weeks; do not print dates):
{Schedule}

Hours per week (must match):
{Hours}

Drafts to synthesize:

{CombinedDrafts}

Now produce the single final plan. Obey the schema and hours exactly; keep content strictly within the brief and these signatures.`,

  // Enhanced repair
  REPAIR_SYSTEM: `You are a precise formatter. Create a complete {TotalWeeks}-week plan. Fix only formatting and duration totals; preserve content.`,
  
  REPAIR_USER: `You returned a plan that needs formatting repairs: {Reason}

REPAIR RULES (do not add commentary before/after):
- The final corrected plan MUST contain exactly {TotalWeeks} week blocks.
- Keep all existing content and headings.
- Do not add or remove tasks except to correct durations so totals match.
- For each week, ensure a 'Time:' line exists and mirrors the task labels and durations, ending with '(Total: H hr)'.
- Ensure both sections exist and are filled: 'Final Outcome:' and 'Skills You'll Learn:'.
- If any weekly duration totals don't match the header '(H hours)', adjust only durations minimally (0.5-hr granularity) so they sum exactly to H without changing labels.

Return ONLY the corrected, complete {TotalWeeks}-week plan.

--- ORIGINAL PLAN ---
{BadPlan}`,

  // Signature patching
  PATCH_SYSTEM: `You are a precise formatter. add minimal lines to satisfy the listed missing signature items inisde the session plan,
without changing schema or hours. Keep exactly {TotalWeeks} weeks and the exact 'Time:' totals.`,
  
  PATCH_USER: `Insert the smallest possible lines to satisfy ALL items below, placing them in the most relevant week(s)
and/or Final sections. Do NOT change the number of weeks or any durations. Keep the exact schema
(Week N, Tasks, Deliverables, Time, Final Outcome, Skills). Prefer one-liners appended to Objectives,
Tasks, Deliverables, Final Outcome, or Skills as appropriate.

Missing items:
- {MissingItems}

Return ONLY the corrected full plan.

--- ORIGINAL PLAN ---
{Plan}`,
};

// Defaults for orchestrator
export const DEFAULT_TONES = [
  "Action-Oriented",
  "Tech-Focused",
  "Story-Telling",
  "Question-Based",
  "Skills-Focused",
];

export const DEFAULT_WEEKS_IF_MISSING_DATES = 8;
export const DEFAULT_HOURS_MAP: Record<number | "default", number> = { default: 4 };
export const DEFAULT_FINAL_WEEK_HOURS_IF_8_PLUS = 3;
