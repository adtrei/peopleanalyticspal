"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KpiCard } from "@/components/ui/KpiCard";
import { HeadcountChart } from "@/components/charts/HeadcountChart";
import { EventsChart } from "@/components/charts/EventsChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { QualityScoreRing } from "@/components/ui/QualityScoreRing";
import { AnswerabilityBadge } from "@/components/ui/AnswerabilityBadge";
import type { Project } from "@/types";
import type { MonthlyHeadcount, MonthlyEvent } from "@/types";
import { computeMonthlyHeadcount } from "@/lib/analytics/headcount";
import { computeMonthlyEvents } from "@/lib/analytics/attrition";
import { generateSampleHeadcount, generateSampleEvents } from "@/data/sampleData";
import { formatNumber } from "@/lib/utils";
import {
  TrendingUp, Users, UserMinus, UserPlus, AlertTriangle, CheckCircle,
} from "lucide-react";

export default function DashboardPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [headcountData, setHeadcountData] = useState<MonthlyHeadcount[]>([]);
  const [eventData, setEventData] = useState<MonthlyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);

  async function loadProject() {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const { project } = await res.json();
        setProject(project);
      }
    } catch {
      // no project
    } finally {
      setLoading(false);
    }
  }

  async function loadDemo() {
    setLoadingDemo(true);
    try {
      await fetch("/api/demo", { method: "POST" });
      await fetch("/api/analyze", { method: "POST" });
      await loadProject();
    } finally {
      setLoadingDemo(false);
    }
  }

  useEffect(() => {
    loadProject();
  }, []);

  // Compute analytics from sample data (client-side for dashboard preview)
  useEffect(() => {
    if (!project) {
      // Show sample data preview even without uploaded files
      const hc = generateSampleHeadcount();
      const ev = generateSampleEvents();
      setHeadcountData(computeMonthlyHeadcount(hc));
      setEventData(computeMonthlyEvents(ev));
    }
  }, [project]);

  const latestCount = headcountData.length > 0 ? headcountData[headcountData.length - 1].count : 0;
  const prevCount = headcountData.length > 1 ? headcountData[headcountData.length - 2].count : latestCount;
  const hcChange = latestCount - prevCount;

  const totalHires = eventData.reduce((a, b) => a + b.hires, 0);
  const totalTerms = eventData.reduce((a, b) => a + b.terminations, 0);

  const qualityScores = Object.values(project?.qualityScores ?? {});
  const avgQuality = qualityScores.length > 0
    ? Math.round(qualityScores.reduce((a, b) => a + b.overall, 0) / qualityScores.length)
    : 0;

  const coverageResults = project?.coverageResults ?? [];
  const directCount = coverageResults.filter((r) => r.answerability === "direct").length;
  const totalQ = coverageResults.length;

  const topGaps = project?.gaps.filter((g) => g.severity === "critical" || g.severity === "high").slice(0, 3) ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {project ? project.name : "People Analytics Pal"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {project
              ? `${project.datasets.length} dataset(s) loaded`
              : "Upload workforce data or load the demo to begin."}
          </p>
        </div>
        {!project && (
          <button
            onClick={loadDemo}
            disabled={loadingDemo}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loadingDemo ? "Loading demo..." : "Load demo data"}
          </button>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <KpiCard
          label="Active Headcount"
          value={formatNumber(latestCount)}
          icon={Users}
          trend={
            hcChange !== 0
              ? {
                  direction: hcChange > 0 ? "up" : "down",
                  label: `${Math.abs(hcChange)} from last month`,
                }
              : undefined
          }
        />
        <KpiCard
          label="Hires YTD"
          value={formatNumber(totalHires)}
          icon={UserPlus}
          variant="success"
        />
        <KpiCard
          label="Terminations YTD"
          value={formatNumber(totalTerms)}
          icon={UserMinus}
          variant="danger"
        />
        <KpiCard
          label="Questions Answerable"
          value={totalQ > 0 ? `${directCount}/${totalQ}` : "—"}
          subtext={totalQ > 0 ? "Run analysis to update" : "Upload data first"}
          icon={CheckCircle}
          variant={directCount / totalQ >= 0.6 ? "success" : directCount > 0 ? "warning" : "default"}
        />
      </div>

      {/* Data trust + quality */}
      {project && qualityScores.length > 0 && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Data Trust Score</h2>
            <Link href="/profile" className="text-xs text-indigo-600 hover:underline">
              View full profile →
            </Link>
          </div>
          <div className="flex items-center gap-8">
            <QualityScoreRing score={avgQuality} label="Overall" />
            <div className="flex-1 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(qualityScores[0]?.dimensions ?? {}).map(([dim, score]) => (
                <div key={dim} className="text-center">
                  <div
                    className={`text-sm font-bold ${
                      (score as number) >= 80 ? "text-green-600" : (score as number) >= 60 ? "text-amber-500" : "text-red-500"
                    }`}
                  >
                    {Math.round(score as number)}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">{dim}</div>
                </div>
              ))}
            </div>
          </div>
          {qualityScores[0]?.safeFor.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {qualityScores[0].safeFor.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-200">
                  ✓ Safe for {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Active Headcount Trend</h2>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <HeadcountChart data={headcountData} height={220} />
          <p className="mt-2 text-xs text-gray-400">Source: headcount snapshot data</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Hires & Terminations by Month</h2>
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Transfers excluded
            </span>
          </div>
          <EventsChart data={eventData} height={220} />
          <p className="mt-2 text-xs text-gray-400">
            Internal transfers normalized out of attrition counts.
          </p>
        </div>
      </div>

      {/* Coverage summary */}
      {coverageResults.length > 0 && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Question Answerability</h2>
            <Link href="/coverage" className="text-xs text-indigo-600 hover:underline">
              View coverage matrix →
            </Link>
          </div>
          <div className="space-y-2">
            {coverageResults.slice(0, 5).map((r) => (
              <div key={r.questionId} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-700 flex-1 mr-3 truncate">{r.questionText}</span>
                <AnswerabilityBadge answerability={r.answerability} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top gaps */}
      {topGaps.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Top Data Gaps</h2>
            <Link href="/gaps" className="text-xs text-indigo-600 hover:underline">
              View all gaps →
            </Link>
          </div>
          <div className="space-y-3">
            {topGaps.map((gap) => (
              <div key={gap.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{gap.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{gap.whyItMatters}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!project && !loading && (
        <div className="mt-8">
          <EmptyState
            title="No data loaded yet"
            description="Upload workforce CSV files or load the demo dataset to see analytics."
            actionLabel="Upload files"
            actionHref="/upload"
          />
        </div>
      )}
    </div>
  );
}
