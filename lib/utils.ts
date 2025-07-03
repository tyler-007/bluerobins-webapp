import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const tagStyles = [
  { backgroundColor: "#F8E8D4", color: "#8B4513" }, // Peach/Brown
  { backgroundColor: "#E5F8F6", color: "#0D5C63" }, // Teal
  { backgroundColor: "#FFF1D0", color: "#B7742F" }, // Gold/Yellow
  { backgroundColor: "#EFE7FA", color: "#5D38A5" }, // Purple
  { backgroundColor: "#FFE2E2", color: "#C53F3F" }, // Pink/Red
  { backgroundColor: "#E2F0CB", color: "#3A642C" }, // Green
  { backgroundColor: "#D4E6F9", color: "#2F6CB3" }, // Blue
  { backgroundColor: "#F4F4F6", color: "#4A4A4A" }, // Gray
];

export const getTagStyle = (tag: string, index: number) => {
  // Use simple hash function to get a more consistent style for the same tag
  const styleIndex = (tag.charCodeAt(0) + index) % tagStyles.length;
  return tagStyles[styleIndex];
};

/**
 * Returns an array of ISO date strings, evenly distributed between startDate and endDate (inclusive).
 * @param {string} startDate - ISO string or Date
 * @param {string} endDate - ISO string or Date
 * @param {number} sessionCount
 * @returns {string[]} Array of ISO date strings
 */
export function getEvenlyDistributedSessionDates(startDate: string | Date, endDate: string | Date, sessionCount: number): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (sessionCount <= 1) return [start.toISOString()];
  const totalMs = end.getTime() - start.getTime();
  let intervalMs = totalMs / (sessionCount - 1);
  const maxIntervalMs = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  if (intervalMs > maxIntervalMs) intervalMs = maxIntervalMs;
  const dates: string[] = [];
  for (let i = 0; i < sessionCount; i++) {
    const d = new Date(start.getTime() + Math.round(i * intervalMs));
    dates.push(d.toISOString());
  }
  return dates;
}
