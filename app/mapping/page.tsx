"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CanonicalFieldMap, Project } from "@/types";
import { CANONICAL_FIELDS } from "@/data/canonicalFields";
import { CheckCircle, AlertCircle, Edit2, Save } from "lucide-react";

export default function MappingPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const { project } = await res.json();
        setProject(project ?? null);
        if (project?.datasets?.[0]) setSelectedDataset(project.datasets[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function saveMapping(m: CanonicalFieldMap) {
    setSaving(true);
    try {
      await fetch("/api/mapping", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetId: m.datasetId,
          sourceColumnName: m.sourceColumnName,
          canonicalFieldName: editValue,
        }),
      });
      setEditing(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-sm text-gray-400 py-20 text-center">Loading...</div>;
  if (!project) return <EmptyState />;

  const mappings = project.fieldMappings.filter((m) => m.datasetId === selectedDataset);

  return (
    <div>
      <PageHeader
        title="Field Mapping"
        description="Review and correct the suggested canonical field mappings for each column."
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-5">
        {[
          { label: "High confidence (≥90%)", color: "text-green-700 bg-green-50 border-green-200" },
          { label: "Medium (50–90%)", color: "text-amber-700 bg-amber-50 border-amber-200" },
          { label: "Low (<50%)", color: "text-red-700 bg-red-50 border-red-200" },
          { label: "User approved", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
        ].map(({ label, color }) => (
          <span key={label} className={`px-2 py-0.5 rounded border text-xs ${color}`}>{label}</span>
        ))}
      </div>

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

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">{mappings.length} mappings</h2>
          <span className="text-xs text-gray-500">
            {mappings.filter((m) => m.approvedByUser).length} user-approved
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 bg-gray-50">
                <th className="text-left px-5 py-3 font-medium">Source Column</th>
                <th className="text-left px-3 py-3 font-medium">Canonical Field</th>
                <th className="text-right px-3 py-3 font-medium">Confidence</th>
                <th className="text-left px-3 py-3 font-medium">Status</th>
                <th className="text-left px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mappings.map((m) => {
                const isEditing = editing === `${m.datasetId}:${m.sourceColumnName}`;
                const pct = Math.round(m.mappingConfidence * 100);
                const confColor =
                  m.approvedByUser ? "text-indigo-700 bg-indigo-50 border-indigo-200" :
                  pct >= 90 ? "text-green-700 bg-green-50 border-green-200" :
                  pct >= 50 ? "text-amber-700 bg-amber-50 border-amber-200" :
                  "text-red-700 bg-red-50 border-red-200";

                return (
                  <tr key={m.sourceColumnName} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-medium text-gray-900">{m.sourceColumnName}</td>
                    <td className="px-3 py-2.5">
                      {isEditing ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="text-xs border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="unknown">-- unmapped --</option>
                          {CANONICAL_FIELDS.map((cf) => (
                            <option key={cf.name} value={cf.name}>{cf.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-1.5 py-0.5 rounded text-xs border ${confColor}`}>
                          {m.canonicalFieldName === "unknown" ? "— unmapped —" : m.canonicalFieldName.replace(/_/g, " ")}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`text-xs font-medium ${pct >= 90 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-500"}`}>
                        {pct}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {m.approvedByUser ? (
                        <span className="flex items-center gap-1 text-xs text-indigo-600">
                          <CheckCircle className="w-3 h-3" /> User approved
                        </span>
                      ) : pct >= 90 ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" /> Auto-mapped
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle className="w-3 h-3" /> Review suggested
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {isEditing ? (
                        <button
                          onClick={() => saveMapping(m)}
                          disabled={saving}
                          className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900"
                        >
                          <Save className="w-3 h-3" /> Save
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditing(`${m.datasetId}:${m.sourceColumnName}`);
                            setEditValue(m.canonicalFieldName);
                          }}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
