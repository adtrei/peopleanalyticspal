"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { AnswerabilityBadge } from "@/components/ui/AnswerabilityBadge";
import type { QuestionCoverageResult } from "@/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";

type Category = string;

const CELL_STATE_CONFIG = {
  available: { label: "Available", bg: "bg-green-400", text: "text-green-700" },
  derived: { label: "Derived", bg: "bg-blue-400", text: "text-blue-700" },
  partial: { label: "Partial", bg: "bg-amber-400", text: "text-amber-700" },
  missing: { label: "Missing", bg: "bg-red-400", text: "text-red-700" },
  low_confidence: { label: "Low Conf.", bg: "bg-purple-400", text: "text-purple-700" },
};

export default function CoveragePage() {
  const [results, setResults] = useState<QuestionCoverageResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hasProject, setHasProject] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) return;
      const { project } = await res.json();
      if (!project) return;
      setHasProject(true);
      setResults(project.coverageResults ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const data = await res.json();
      setResults(data.coverageResults ?? []);
    } finally {
      setAnalyzing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-sm text-gray-400 py-20 text-center">Loading...</div>;
  if (!hasProject) return <EmptyState />;

  const categories = Array.from(new Set(results.map((r) => r.questionId.split("_")[0])));

  const grouped = categories.reduce<Record<Category, QuestionCoverageResult[]>>((acc, cat) => {
    acc[cat] = results.filter((r) => r.questionId.startsWith(cat));
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Coverage Matrix"
        description="Each row is a business question. Cells show whether each required concept is available, derived, partial, or missing."
        actions={
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {analyzing && <Loader2 className="w-3 h-3 animate-spin" />}
            {analyzing ? "Analyzing..." : "Re-analyze"}
          </button>
        }
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(CELL_STATE_CONFIG).map(([state, cfg]) => (
          <div key={state} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded-sm", cfg.bg)} />
            <span className="text-xs text-gray-600">{cfg.label}</span>
          </div>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-gray-500 mb-4">No analysis results yet. Run analysis to evaluate question coverage.</p>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {analyzing ? "Analyzing..." : "Run Analysis"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, catResults]) => (
            <div key={category} className="card overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 capitalize">{category}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {catResults.map((result) => (
                  <div key={result.questionId}>
                    <button
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 text-left"
                      onClick={() => setExpanded(expanded === result.questionId ? null : result.questionId)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {expanded === result.questionId ? (
                          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="text-sm text-gray-900 truncate">{result.questionText}</span>
                      </div>
                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        <span className="text-xs text-gray-500">
                          {Math.round(result.confidence * 100)}% confidence
                        </span>
                        <AnswerabilityBadge answerability={result.answerability} />
                      </div>
                    </button>

                    {/* Concept cells */}
                    <div className="px-5 pb-3 flex flex-wrap gap-2">
                      {result.knowns.map((k) => (
                        <span
                          key={k.concept}
                          className={cn(
                            "px-2 py-0.5 rounded text-xs border",
                            k.status === "known"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : k.status === "derived"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          )}
                          title={k.qualityNotes.join(", ")}
                        >
                          {k.concept}
                        </span>
                      ))}
                      {result.unknowns.map((u) => (
                        <span
                          key={u.concept}
                          className="px-2 py-0.5 rounded text-xs border bg-red-50 text-red-700 border-red-200"
                          title={u.whyMissing}
                        >
                          {u.concept}
                        </span>
                      ))}
                    </div>

                    {/* Expanded detail */}
                    {expanded === result.questionId && (
                      <div className="mx-5 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                        <p className="text-gray-700 mb-3 font-medium">{result.executiveSummary}</p>

                        {result.assumptions.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs font-medium text-amber-700 mb-1">Assumptions</div>
                            <ul className="list-disc list-inside space-y-0.5">
                              {result.assumptions.map((a, i) => (
                                <li key={i} className="text-xs text-amber-700">{a}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.qualityRisks.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs font-medium text-red-700 mb-1">Quality Risks</div>
                            <ul className="list-disc list-inside space-y-0.5">
                              {result.qualityRisks.map((r, i) => (
                                <li key={i} className="text-xs text-red-700">{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.recommendations.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Recommendations</div>
                            <ul className="list-disc list-inside space-y-0.5">
                              {result.recommendations.slice(0, 3).map((rec, i) => (
                                <li key={i} className="text-xs text-gray-600">{rec.action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
