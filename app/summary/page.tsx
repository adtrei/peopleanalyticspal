"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { QualityScoreRing } from "@/components/ui/QualityScoreRing";
import { AnswerabilityBadge } from "@/components/ui/AnswerabilityBadge";
import type { Project } from "@/types";
import { generateExecutiveSummary } from "@/lib/ai/client";
import { formatNumber } from "@/lib/utils";
import { Loader2, CheckCircle, AlertTriangle, XCircle, Sparkles } from "lucide-react";

export default function SummaryPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [generatingSummary, setGeneratingSummary] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ project }) => setProject(project ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function generateSummary() {
    if (!project) return;
    setGeneratingSummary(true);
    try {
      const qualityScore = Object.values(project.qualityScores)[0];
      const summary = await generateExecutiveSummary(
        qualityScore?.overall ?? 0,
        project.coverageResults,
        project.gaps
      );
      setAiSummary(summary);
    } finally {
      setGeneratingSummary(false);
    }
  }

  if (loading) return <div className="text-sm text-gray-400 py-20 text-center">Loading...</div>;
  if (!project) return <EmptyState />;

  const qualityScore = Object.values(project.qualityScores)[0];
  const coverageResults = project.coverageResults;
  const gaps = project.gaps;

  const directCount = coverageResults.filter((r) => r.answerability === "direct").length;
  const partialCount = coverageResults.filter((r) => r.answerability === "partial").length;
  const notAnswerableCount = coverageResults.filter((r) => r.answerability === "not_answerable").length;
  const totalQ = coverageResults.length;

  const criticalGaps = gaps.filter((g) => g.severity === "critical" || g.severity === "high");

  return (
    <div>
      <PageHeader
        title="Executive Summary"
        description="Top findings, data trust score, question answerability, and recommended next steps."
        actions={
          <button
            onClick={generateSummary}
            disabled={generatingSummary}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {generatingSummary ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {generatingSummary ? "Generating..." : "Generate AI Summary"}
          </button>
        }
      />

      {/* AI Summary */}
      {aiSummary && (
        <div className="card p-5 mb-6 border-indigo-200 bg-indigo-50">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-indigo-900">AI-Generated Executive Summary</h2>
          </div>
          <p className="text-sm text-indigo-800 whitespace-pre-line">{aiSummary}</p>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {qualityScore && (
          <div className="card p-5 flex flex-col items-center justify-center">
            <QualityScoreRing score={qualityScore.overall} size={60} />
            <div className="text-xs text-gray-500 mt-2">Data Quality</div>
          </div>
        )}
        <div className="card p-5 text-center">
          <div className="text-2xl font-bold text-green-600">{directCount}</div>
          <div className="text-xs text-gray-500 mt-1">Directly Answerable</div>
          <div className="text-xs text-gray-400">of {totalQ} questions</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-2xl font-bold text-amber-600">{partialCount}</div>
          <div className="text-xs text-gray-500 mt-1">Partially Answerable</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-2xl font-bold text-red-600">{notAnswerableCount}</div>
          <div className="text-xs text-gray-500 mt-1">Not Answerable</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Datasets */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Data Sources</h2>
          <div className="space-y-2">
            {project.datasets.map((ds) => (
              <div key={ds.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">{ds.name}</span>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span>{formatNumber(ds.rowCount)} rows</span>
                  <span className="capitalize text-indigo-600">{ds.sourceType.replace(/_/g, " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality warnings */}
        {qualityScore && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Quality Checks</h2>
            <div className="space-y-1.5">
              {qualityScore.checks.slice(0, 6).map((check, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  {check.status === "pass" ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : check.status === "warn" ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-gray-600">{check.evidence}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Question answerability */}
      {coverageResults.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Question Coverage Summary</h2>
          <div className="space-y-2">
            {coverageResults.map((r) => (
              <div key={r.questionId} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="text-sm text-gray-900 truncate">{r.questionText}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{r.executiveSummary}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">{Math.round(r.confidence * 100)}%</span>
                  <AnswerabilityBadge answerability={r.answerability} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top gaps / recommendations */}
      {criticalGaps.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Priority Recommendations</h2>
          <div className="space-y-3">
            {criticalGaps.slice(0, 5).map((gap, i) => (
              <div key={gap.id} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{gap.title}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{gap.recommendedAction}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Owner: {gap.likelyOwner} · {gap.estimatedEffort} effort</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
