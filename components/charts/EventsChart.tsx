"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MonthlyEvent } from "@/types";

interface Props {
  data: MonthlyEvent[];
  showTransfers?: boolean;
  height?: number;
}

export function EventsChart({ data, showTransfers = false, height = 280 }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        No event data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="hires" name="Hires" fill="#10b981" radius={[2, 2, 0, 0]} />
        <Bar dataKey="terminations" name="Terminations" fill="#ef4444" radius={[2, 2, 0, 0]} />
        {showTransfers && (
          <>
            <Bar dataKey="transfersIn" name="Transfers In" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="transfersOut" name="Transfers Out" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
          </>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
