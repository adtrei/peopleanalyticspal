import { cn } from "@/lib/utils";
import type { Answerability } from "@/types";

const CONFIG: Record<Answerability, { label: string; className: string }> = {
  direct: {
    label: "Directly Answerable",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  partial: {
    label: "Partially Answerable",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  not_answerable: {
    label: "Not Answerable",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export function AnswerabilityBadge({ answerability }: { answerability: Answerability }) {
  const config = CONFIG[answerability];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
