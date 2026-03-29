"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { HeadcountChart } from "@/components/charts/HeadcountChart";
import { KpiCard } from "@/components/ui/KpiCard";
import type { MonthlyHeadcount } from "@/types";
import { generateSampleHeadcount } from "@/data/sampleData";
import { computeMonthlyHeadcount, detectHeadcountAnomalies } from "@/lib/analytics/headcount";
import { formatNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertCircle, Users } from "lucide-react";

export default function HeadcountPage() {
  const [monthly, setMonthly] = useState<MonthlyHeadcount[]>([]);
  const [breakdown, setBreakdown] = useState<"byOrg" | "byDept" | "byJob">("byOrg");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Use sample data — in a full build this would come from the parsed CSV store
    const rows = generateSampleHeadcount();
    setMonthly(computeMonthlyHeadcount(rows));
    setLoaded(true);
  }, []);

  if (!loaded) return <div className="text-sm text-gray-400 py-20 text-center">Loading...</div>;
  if (monthly.length === 0) return <EmptyState />;

  const latest = monthly[monthly.length - 1];
  const prev = monthly[monthly.length - 2];
  const prevPrev = monthly[monthly.length - 3];
  const change = latest && prev ? latest.count - prev.count : 0;
  const prevChange = prev && prevPrev ? prev.count - prevPrev.count : 0;
  const anomalies = detectHeadcountAnomalies(monthly);

  // Build segment breakdown from latest month
  const segmentData = latest?.[breakdown] ?? {};
  const segments = Object.entries(segmentData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div>
      <PageHeader
        title="Headcount Explorer"
        description="Active headcount trends, month-over-month changes, and segment breakdowns."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Current Headcount"
          value={formatNumber(latest?.count ?? 0)}
          icon={Users}
          trend={change !== 0 ? {
            direction: change > 0 ? "up" : "down",
            label: `${Math.abs(change)} vs last month`,
          } : undefined}
        />
        <KpiCard
          label="Peak Headcount"
          value={formatNumber(Math.max(...monthly.map((m) => m.count)))}
          subtext="Over the period"
        />
        <KpiCard
          label="MoM Change"
          value={`${change >= 0 ? "+" : ""}${change}`}
          icon={change >= 0 ? TrendingUp : TrendingDown}
          variant={change > 0 ? "success" : change < 0 ? "danger" : "default"}
        />
        <KpiCard
          label="Anomalies Detected"
          value={anomalies.length}
          icon={AlertCircle}
          variant={anomalies.length > 0 ? "warning" : "success"}
          subtext={anomalies.length > 0 ? "Months with >5% change" : "No unusual changes"}
        />
      </div>

      {/* Main chart */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Active Headcount Over Time
        </h2>
        <HeadcountChart data={monthly} height={280} />
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Month-over-Month Anomalies</h2>
          <div className="space-y-2">
            {anomalies.map((a) => (
              <div key={a.month} className="flex items-center justify-between p-2 bg-amber-50 rounded border border-amber-200 text-xs">
                <span className="font-medium text-amber-900">{a.month}</span>
                <span className={a.flag === "spike" ? "text-green-700" : "text-red-700"}>
                  {a.flag === "spike" ? "↑" : "↓"} {Math.abs(a.change)} ({a.pctChange > 0 ? "+" : ""}{(a.pctChange * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Segment breakdown */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Headcount Breakdown — {latest?.month}
          </h2>
          <div className="flex gap-1">
            {(["byOrg", "byDept", "byJob"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setBreakdown(key)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  breakdown === key
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {key === "byOrg" ? "Org" : key === "byDept" ? "Dept" : "Job"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {segments.map(([name, count]) => {
            const pct = latest.count > 0 ? count / latest.count : 0;
            return (
              <div key={name} className="flex items-center gap-3">
                <div className="text-xs text-gray-700 w-36 truncate" title={name}>{name}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>
                <div className="text-xs font-medium text-gray-700 w-10 text-right">{formatNumber(count)}</div>
                <div className="text-xs text-gray-400 w-10 text-right">{(pct * 100).toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
