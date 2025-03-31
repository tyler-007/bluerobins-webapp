import { clsx, type ClassValue } from "clsx";
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
