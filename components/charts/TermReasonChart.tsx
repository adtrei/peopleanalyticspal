"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { TerminationReasonSummary } from "@/types";
import { truncate } from "@/lib/utils";

interface Props {
  data: TerminationReasonSummary[];
  height?: number;
}

const VOLUNTARY_COLOR = "#f59e0b";
const INVOLUNTARY_COLOR = "#ef4444";
const UNKNOWN_COLOR = "#94a3b8";

export function TermReasonChart({ data, height = 280 }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        No termination data available
      </div>
    );
  }

  const top = data.slice(0, 10).map((d) => ({
    ...d,
    shortReason: truncate(d.reason, 24),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={top}
        layout="vertical"
        margin={{ top: 5, right: 20, bottom: 5, left: 100 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis dataKey="shortReason" type="category" tick={{ fontSize: 11 }} width={100} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
          formatter={(value: number) => [value, "Count"]}
        />
        <Bar dataKey="count" name="Count" radius={[0, 2, 2, 0]}>
          {top.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.inferredVoluntary === "voluntary"
                  ? VOLUNTARY_COLOR
                  : entry.inferredVoluntary === "involuntary"
                  ? INVOLUNTARY_COLOR
                  : UNKNOWN_COLOR
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
