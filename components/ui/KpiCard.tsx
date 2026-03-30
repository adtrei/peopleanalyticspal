import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  trend?: { direction: "up" | "down" | "neutral"; label: string };
  variant?: "default" | "success" | "warning" | "danger";
}

const VARIANT_STYLES = {
  default: "bg-white border-gray-200",
  success: "bg-green-50 border-green-200",
  warning: "bg-amber-50 border-amber-200",
  danger: "bg-red-50 border-red-200",
};

export function KpiCard({ label, value, subtext, icon: Icon, trend, variant = "default" }: Props) {
  return (
    <div className={cn("rounded-xl border p-5 shadow-sm", VARIANT_STYLES[variant])}>
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtext && <div className="text-xs text-gray-500 mt-0.5">{subtext}</div>}
        {trend && (
          <div
            className={cn(
              "text-xs font-medium mt-1",
              trend.direction === "up" ? "text-green-600" : trend.direction === "down" ? "text-red-600" : "text-gray-500"
            )}
          >
            {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.label}
          </div>
        )}
      </div>
    </div>
  );
}
