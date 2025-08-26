export let VERBOSE = (process.env.VERBOSE_LOG || "1").trim() !== "0";

export const setVerbose = (v: boolean) => { VERBOSE = v; };

export const logSection = (title: string) => {
  if (!VERBOSE) return;
  console.log("\n" + "=".repeat(90));
  console.log(title);
  console.log("=".repeat(90) + "\n");
};

export const logText = (label: string, text?: string | null) => {
  if (!VERBOSE) return;
  console.log(`[LLM OUTPUT] ${label}:\n${(text || "").trim()}\n`);
};

export const logJson = (label: string, obj: any, limit?: number) => {
  if (!VERBOSE) return;
  try {
    let s = JSON.stringify(obj, null, 2);
    if (limit && s.length > limit) s = s.slice(0, limit) + "... [truncated]";
    console.log(`[DATA] ${label}:\n${s}\n`);
  } catch {
    console.log(`[DATA] ${label} (non-serializable)`);
  }
};