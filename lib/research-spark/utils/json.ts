export const parseJsonSafely = (text?: string | null): any | null => {
    if (!text) return null;
    let s = text.trim();
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };