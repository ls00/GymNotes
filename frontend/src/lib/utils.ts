import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWeight(val: number | string | undefined): string {
  if (val === undefined || val === null) return "0.0";
  const num = typeof val === "string" ? parseFloat(val) : val;
  return num.toFixed(1);
}

