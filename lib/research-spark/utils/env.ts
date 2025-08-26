export const getEnv = (key: string, fallback = "") => (process.env[key] || fallback).trim();

export const ensureEnv = (key: string) => {
  const v = getEnv(key);
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;}