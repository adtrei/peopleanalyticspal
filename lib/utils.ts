import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

export function answerabilityColor(answerability: string): string {
  switch (answerability) {
    case "direct": return "text-green-700 bg-green-50 border-green-200";
    case "partial": return "text-amber-700 bg-amber-50 border-amber-200";
    case "not_answerable": return "text-red-700 bg-red-50 border-red-200";
    default: return "text-gray-700 bg-gray-50 border-gray-200";
  }
}

export function epistemicColor(status: string): string {
  switch (status) {
    case "known": return "text-green-700 bg-green-50";
    case "derived": return "text-blue-700 bg-blue-50";
    case "assumed": return "text-amber-700 bg-amber-50";
    case "unknown": return "text-red-700 bg-red-50";
    case "contested": return "text-purple-700 bg-purple-50";
    default: return "text-gray-700 bg-gray-50";
  }
}

export function cellStateColor(state: string): string {
  switch (state) {
    case "available": return "bg-green-100 text-green-800";
    case "derived": return "bg-blue-100 text-blue-800";
    case "partial": return "bg-amber-100 text-amber-800";
    case "missing": return "bg-red-100 text-red-800";
    case "low_confidence": return "bg-purple-100 text-purple-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

export function severityColor(severity: string): string {
  switch (severity) {
    case "critical": return "text-red-800 bg-red-100";
    case "high": return "text-orange-800 bg-orange-100";
    case "medium": return "text-amber-800 bg-amber-100";
    case "low": return "text-green-800 bg-green-100";
    default: return "text-gray-800 bg-gray-100";
  }
}

export function qualityScoreColor(score: number): string {
  if (score >= 80) return "text-green-700";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}
