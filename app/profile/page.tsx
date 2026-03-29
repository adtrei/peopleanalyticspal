"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { QualityScoreRing } from "@/components/ui/QualityScoreRing";
import type { Project } from "@/types";
import { formatPct, formatNumber } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

export default function ProfilePage() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ project }) => {
        setProject(project ?? null);
        if (project?.datasets?.[0]) setSelectedDataset(project.datasets[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-gray-400 py-20 text-center">Loading...</div>;
  if (!project) return <EmptyState />;

  const profiles = project.columnProfiles.filter((p) => p.datasetId === selectedDataset);
  const qualityScore = selectedDataset ? project.qualityScores[selectedDataset] : undefined;

  return (
    <div>
      <PageHeader
        title="Data Profile"
        description="Row counts, column statistics, null rates, and quality checks for each uploaded file."
      />

      {/* Dataset selector */}
      <div className="flex gap-2 mb-6">
        {project.datasets.map((ds) => (
          <button
            key={ds.id}
            onClick={() => setSelectedDataset(ds.id)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              selectedDataset === ds.id
                ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-medium"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {ds.name}
          </button>
        ))}
      </div>

      {selectedDataset && (
        <>
          {/* Dataset stats */}
          {(() => {
            const ds = project.datasets.find((d) => d.id === selectedDataset)!;
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Rows", value: formatNumber(ds.rowCount) },
                  { label: "Columns", value: ds.columnCount },
                  { label: "File Size", value: ds.fileSizeBytes > 0 ? `${(ds.fileSizeBytes / 1024).toFixed(1)} KB` : "Demo" },
                  { label: "Source Type", value: ds.sourceType.replace(/_/g, " ") },
                ].map(({ label, value }) => (
                  <div key={label} className="card p-4">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
                    <div className="text-lg font-bold text-gray-900 mt-1 capitalize">{value}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Quality score */}
          {qualityScore && (
            <div className="card p-5 mb-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Quality Assessment</h2>
              <div className="flex items-center gap-8 mb-4">
                <QualityScoreRing score={qualityScore.overall} label="Overall" size={72} />
                <div className="flex-1 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Object.entries(qualityScore.dimensions).map(([dim, score]) => (
                    <div key={dim} className="text-center">
                      <div className={`text-sm font-bold ${score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-500" : "text-red-500"}`}>
                        {Math.round(score)}
                      </div>
                      <div className="text-xs text-gray-400 capitalize">{dim}</div>
                    </div>
                  ))}
                </div>
              </div>

              {qualityScore.criticalWarnings.length > 0 && (
                <div className="space-y-2">
                  {qualityScore.criticalWarnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-amber-50 rounded border border-amber-200 text-xs text-amber-800">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {w}
                    </div>
                  ))}
                </div>
              )}

              {qualityScore.safeFor.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {qualityScore.safeFor.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-200">
                      <CheckCircle className="w-3 h-3" /> Safe for {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Check list */}
              <div className="mt-4 space-y-1.5">
                {qualityScore.checks.map((check, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded text-xs ${
                    check.status === "pass" ? "bg-gray-50 text-gray-600" :
                    check.status === "warn" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-800"
                  }`}>
                    {check.status === "pass" ? <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" /> :
                     check.status === "warn" ? <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" /> :
                     <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0 text-red-500" />}
                    <span><strong>{check.rule}</strong> — {check.evidence}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Column profiles */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Column Profiles ({profiles.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium">Column</th>
                    <th className="text-left px-3 py-3 font-medium">Type</th>
                    <th className="text-left px-3 py-3 font-medium">Role</th>
                    <th className="text-right px-3 py-3 font-medium">Null %</th>
                    <th className="text-right px-3 py-3 font-medium">Unique</th>
                    <th className="text-left px-3 py-3 font-medium">Sample Values</th>
                    <th className="text-left px-3 py-3 font-medium">Warnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {profiles.map((p) => (
                    <tr key={p.sourceColumnName} className="hover:bg-gray-50">
                      <td className="px-5 py-2.5 font-medium text-gray-900">{p.sourceColumnName}</td>
                      <td className="px-3 py-2.5">
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">{p.inferredType}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">{p.detectedRole.replace(/_/g, " ")}</span>
                      </td>
                      <td className={`px-3 py-2.5 text-right text-xs font-medium ${p.nullRate > 0.3 ? "text-red-600" : p.nullRate > 0.1 ? "text-amber-600" : "text-gray-500"}`}>
                        {formatPct(p.nullRate)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-gray-500">
                        {formatNumber(p.uniqueCount)}
                      </td>
                      <td className="px-3 py-2.5 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {p.sampleValues.slice(0, 3).map((v, i) => (
                            <span key={i} className="px-1 py-0.5 bg-gray-100 text-gray-600 rounded text-xs truncate max-w-[80px]" title={v}>
                              {v || "—"}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {p.warnings.length > 0 ? (
                          <div className="flex items-center gap-1 text-amber-600">
                            <Info className="w-3 h-3 flex-shrink-0" />
                            <span className="text-xs">{p.warnings[0]}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
