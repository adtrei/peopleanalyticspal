"use client";

import { cn } from "@/lib/utils";

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function QualityScoreRing({ score, size = 80, strokeWidth = 8, label }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score, 0), 100);
  const dashOffset = circumference * (1 - pct / 100);

  const color =
    pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn("font-bold text-sm", pct >= 80 ? "text-green-700" : pct >= 60 ? "text-amber-600" : "text-red-600")}
          >
            {pct}
          </span>
        </div>
      </div>
      {label && <span className="text-xs text-gray-500">{label}</span>}
    </div>
  );
}
