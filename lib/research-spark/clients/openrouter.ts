import { getEnv } from "../utils/env";
import { logText } from "../utils/log";
import { CONFIG } from "../prompts";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatPayload {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  // Reasoning fields supported by certain models on OpenRouter
  // Only send the "reasoning" object; do NOT send "reasoning_effort" separately.
  reasoning?: { effort?: "low" | "medium" | "high" };
}

const baseUrl = () =>
  getEnv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").replace(/\/$/, "");

const headers = () => {
  const key = getEnv("OPENROUTER_API_KEY");
  if (!key) throw new Error("Missing OPENROUTER_API_KEY");
  const h: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  const ref = getEnv("OPENROUTER_HTTP_REFERER");
  const ttl = getEnv("OPENROUTER_X_TITLE");
  if (ref) h["HTTP-Referer"] = ref;
  if (ttl) h["X-Title"] = ttl;
  return h;
};

export const postChat = async (payload: ChatPayload): Promise<string | null> => {
  const url = `${baseUrl()}/chat/completions`;
  const timeoutMs = Number(getEnv("OPENROUTER_TIMEOUT", "60000"));
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`[ERROR] OpenRouter HTTP ${res.status}: ${txt.slice(0, 500)}`);
      return null;
    }
    const data: any = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? null;
    logText(`${payload.model} response`, content);
    return content;
  } catch (e: any) {
    console.error("[ERROR] OpenRouter error:", e?.message || e);
    return null;
  } finally {
    clearTimeout(id);
  }
};

export const callOpenRouterChat = async (
  deployment: string,
  system_prompt: string,
  user_prompt: string,
  opts?: { max_tokens?: number; temperature?: number }
) => {
  if (!deployment) throw new Error("Missing deployment name for generative model (openrtr_GENERATIVE_DEPLOYMENT).");
  return postChat({
    model: deployment,
    messages: [
      { role: "system", content: system_prompt },
      { role: "user", content: user_prompt },
    ],
    temperature: opts?.temperature ?? CONFIG.temperature,
    max_tokens: opts?.max_tokens ?? 2000,
  });
};

export const callOpenRouterReasoning = async (
  deployment: string,
  system_prompt: string,
  user_prompt: string,
  opts?: { max_completion_tokens?: number; reasoning_effort?: "low" | "medium" | "high"; temperature?: number }
) => {
    if (!deployment) throw new Error("Missing deployment name for reasoning model (openrtr_SYNTHESIS_DEPLOYMENT).");
    return postChat({
    model: deployment,
    messages: [
      { role: "system", content: system_prompt },
      { role: "user", content: user_prompt },
    ],
    // OpenRouter's /chat/completions uses max_tokens; map from provided option
    max_tokens: opts?.max_completion_tokens ?? 2000,
    temperature: opts?.temperature ?? CONFIG.temperature,
    // Only one of "reasoning" and "reasoning_effort" may be provided.
    // We send only the "reasoning" object with the effort level.
    reasoning: opts?.reasoning_effort ? { effort: opts.reasoning_effort } : undefined,
  });
};