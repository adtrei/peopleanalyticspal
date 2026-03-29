"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MonthlyHeadcount } from "@/types";

interface Props {
  data: MonthlyHeadcount[];
  height?: number;
}

export function HeadcountChart({ data, height = 280 }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        No headcount data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    month: d.month,
    "Active Headcount": d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="Active Headcount"
          stroke="#4f46e5"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
