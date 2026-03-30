"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Dataset } from "@/types";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [uploadedDatasets, setUploadedDatasets] = useState<Dataset[]>([]);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  async function uploadFiles(files: FileList) {
    setStatus("uploading");
    setError("");
    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append("files", file);
    }
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setUploadedDatasets(data.datasets);
      setStatus("success");
    } catch (e: unknown) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      await fetch("/api/analyze", { method: "POST" });
      router.push("/summary");
    } finally {
      setAnalyzing(false);
    }
  }

  async function loadDemo() {
    setLoadingDemo(true);
    setError("");
    try {
      const res = await fetch("/api/demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUploadedDatasets(data.datasets);
      setStatus("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load demo");
    } finally {
      setLoadingDemo(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  const SOURCE_TYPE_LABELS: Record<string, string> = {
    hcm_snapshot: "Headcount Snapshot",
    workforce_event: "Hire / Termination Events",
    ats_event: "ATS / Recruiting",
    survey: "Survey / Engagement",
    schema_manifest: "Schema Manifest",
  };

  return (
    <div>
      <PageHeader
        title="Upload / Project Setup"
        description="Upload one or more CSV files to begin profiling your workforce data."
      />

      {/* Upload zone */}
      <div
        className={`card border-2 border-dashed p-10 text-center transition-colors cursor-pointer mb-5 ${
          dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-indigo-300 hover:bg-gray-50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">
          Drag & drop CSV files here, or click to browse
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Supports: headcount snapshots, hire/term events, schema manifests
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Max {process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? 50}MB per file</p>
      </div>

      {/* Status */}
      {status === "uploading" && (
        <div className="flex items-center gap-2 text-sm text-indigo-600 mb-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Uploading and profiling...
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 mb-4">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Uploaded files */}
      {uploadedDatasets.length > 0 && (
        <div className="card p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              {uploadedDatasets.length} file(s) uploaded successfully
            </h2>
          </div>
          <div className="space-y-3">
            {uploadedDatasets.map((ds) => (
              <div key={ds.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{ds.name}</div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    <span>{ds.rowCount.toLocaleString()} rows</span>
                    <span>{ds.columnCount} columns</span>
                    <span className="capitalize text-indigo-600">
                      {SOURCE_TYPE_LABELS[ds.sourceType] ?? ds.sourceType}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ds.columns.slice(0, 8).map((col) => (
                      <span key={col} className="px-1.5 py-0.5 bg-white border border-gray-200 text-xs rounded text-gray-600">
                        {col}
                      </span>
                    ))}
                    {ds.columns.length > 8 && (
                      <span className="px-1.5 py-0.5 text-xs text-gray-400">+{ds.columns.length - 8} more</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {analyzing && <Loader2 className="w-4 h-4 animate-spin" />}
              {analyzing ? "Analyzing..." : "Run Analysis"}
            </button>
            <a
              href="/profile"
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              View Data Profile
            </a>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-50 px-3 text-xs text-gray-400">or</span>
        </div>
      </div>

      {/* Demo mode */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Try with demo data</h3>
        <p className="text-xs text-gray-500 mb-4">
          Load a synthetic workforce dataset to explore all features without uploading real data.
        </p>
        <button
          onClick={loadDemo}
          disabled={loadingDemo}
          className="flex items-center gap-2 px-4 py-2 border border-indigo-300 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
        >
          {loadingDemo && <Loader2 className="w-4 h-4 animate-spin" />}
          {loadingDemo ? "Loading..." : "Load demo dataset"}
        </button>
      </div>
    </div>
  );
}
