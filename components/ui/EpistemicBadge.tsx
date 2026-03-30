import { cn } from "@/lib/utils";
import type { EpistemicStatus } from "@/types";

const CONFIG: Record<EpistemicStatus, { label: string; className: string; dot: string }> = {
  known: {
    label: "Known",
    className: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  derived: {
    label: "Derived",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  assumed: {
    label: "Assumed",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  unknown: {
    label: "Unknown",
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  contested: {
    label: "Contested",
    className: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
};

interface Props {
  status: EpistemicStatus;
  size?: "sm" | "md";
}

export function EpistemicBadge({ status, size = "md" }: Props) {
  const config = CONFIG[status] ?? CONFIG.unknown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border font-medium",
        config.className,
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-xs"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", config.dot)} />
      {config.label}
    </span>
  );
}
