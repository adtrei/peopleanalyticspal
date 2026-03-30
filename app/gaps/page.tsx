"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GapItem, GapType, Severity } from "@/types";
import { cn, severityColor } from "@/lib/utils";
import { Database, AlertTriangle, Workflow, Building2 } from "lucide-react";

const GAP_TYPE_CONFIG: Record<GapType, { label: string; icon: typeof Database; color: string }> = {
  data: { label: "Data Gap", icon: Database, color: "text-blue-600 bg-blue-50 border-blue-200" },
  quality: { label: "Quality Gap", icon: AlertTriangle, color: "text-amber-600 bg-amber-50 border-amber-200" },
  process: { label: "Process Gap", icon: Workflow, color: "text-purple-600 bg-purple-50 border-purple-200" },
  capability: { label: "Capability Gap", icon: Building2, color: "text-red-600 bg-red-50 border-red-200" },
};

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];

export default function GapsPage() {
  const [gaps, setGaps] = useState<GapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProject, setHasProject] = useState(false);
  const [filterType, setFilterType] = useState<GapType | "all">("all");
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ project }) => {
        if (project) {
          setHasProject(true);
          setGaps(project.gaps ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-gray-400 py-20 text-center">Loading...</div>;
  if (!hasProject) return <EmptyState />;

  const filtered = gaps
    .filter((g) => filterType === "all" || g.gapType === filterType)
    .filter((g) => filterSeverity === "all" || g.severity === filterSeverity)
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

  const byType = Object.entries(GAP_TYPE_CONFIG).map(([type, cfg]) => ({
    type: type as GapType,
    label: cfg.label,
    count: gaps.filter((g) => g.gapType === type).length,
    color: cfg.color,
  }));

  return (
    <div>
      <PageHeader
        title="Gap Register"
        description="Data, quality, process, and capability gaps that affect workforce analytics decision quality."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {byType.map(({ type, label, count, color }) => (
          <button
            key={type}
            onClick={() => setFilterType(filterType === type ? "all" : type)}
            className={cn(
              "p-3 rounded-xl border text-left transition-all",
              filterType === type ? color : "bg-white border-gray-200 hover:bg-gray-50"
            )}
          >
            <div className="text-lg font-bold text-gray-900">{count}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as Severity | "all")}
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span className="text-xs text-gray-500 self-center">{filtered.length} gaps shown</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-gray-500">
            {gaps.length === 0
              ? "No gaps detected yet. Run analysis to identify gaps."
              : "No gaps match the current filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((gap) => {
            const typeCfg = GAP_TYPE_CONFIG[gap.gapType];
            const Icon = typeCfg.icon;
            return (
              <div key={gap.id} className="card p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium", typeCfg.color)}>
                      <Icon className="w-3 h-3" />
                      {typeCfg.label}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", severityColor(gap.severity))}>
                      {gap.severity}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{gap.estimatedEffort} effort</span>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 mb-1">{gap.title}</h3>
                <p className="text-xs text-gray-600 mb-3">{gap.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2 bg-amber-50 rounded border border-amber-100">
                    <div className="font-medium text-amber-800 mb-0.5">Why it matters</div>
                    <div className="text-amber-700">{gap.whyItMatters}</div>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded border border-indigo-100">
                    <div className="font-medium text-indigo-800 mb-0.5">Recommended action</div>
                    <div className="text-indigo-700">{gap.recommendedAction}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span>Owner: {gap.likelyOwner}</span>
                  {gap.affectedQuestions.length > 0 && (
                    <span>{gap.affectedQuestions.length} question(s) affected</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
