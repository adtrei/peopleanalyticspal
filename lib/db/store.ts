/**
 * In-memory session store for MVP.
 *
 * FUTURE: Replace with Supabase Postgres persistence.
 * Each function here corresponds to a future Supabase table operation.
 * Store structure mirrors the planned DB schema.
 */
import type { Project, Dataset, ColumnProfile, CanonicalFieldMap, DataQualityScore, QuestionCoverageResult, GapItem } from "@/types";

// ─── In-memory store (Node.js module singleton) ───────────────────────────────
let _project: Project | null = null;

export function getProject(): Project | null {
  return _project;
}

export function initProject(name: string): Project {
  _project = {
    id: `proj_${Date.now()}`,
    name,
    createdAt: new Date().toISOString(),
    datasets: [],
    columnProfiles: [],
    fieldMappings: [],
    qualityScores: {},
    coverageResults: [],
    gaps: [],
  };
  return _project;
}

export function upsertDataset(dataset: Dataset): void {
  // FUTURE: INSERT INTO datasets
  if (!_project) initProject("My Project");
  const existing = _project!.datasets.findIndex((d) => d.id === dataset.id);
  if (existing >= 0) _project!.datasets[existing] = dataset;
  else _project!.datasets.push(dataset);
}

export function upsertColumnProfiles(profiles: ColumnProfile[]): void {
  // FUTURE: UPSERT INTO column_profiles
  if (!_project) return;
  for (const p of profiles) {
    const existing = _project.columnProfiles.findIndex(
      (cp) => cp.datasetId === p.datasetId && cp.sourceColumnName === p.sourceColumnName
    );
    if (existing >= 0) _project.columnProfiles[existing] = p;
    else _project.columnProfiles.push(p);
  }
}

export function upsertFieldMappings(mappings: CanonicalFieldMap[]): void {
  // FUTURE: UPSERT INTO canonical_field_maps
  if (!_project) return;
  for (const m of mappings) {
    const existing = _project.fieldMappings.findIndex(
      (fm) => fm.datasetId === m.datasetId && fm.sourceColumnName === m.sourceColumnName
    );
    if (existing >= 0) _project.fieldMappings[existing] = m;
    else _project.fieldMappings.push(m);
  }
}

export function setQualityScore(datasetId: string, score: DataQualityScore): void {
  // FUTURE: UPSERT INTO data_quality_scores
  if (!_project) return;
  _project.qualityScores[datasetId] = score;
}

export function setCoverageResults(results: QuestionCoverageResult[]): void {
  // FUTURE: UPSERT INTO question_coverage_results
  if (!_project) return;
  _project.coverageResults = results;
}

export function setGaps(gaps: GapItem[]): void {
  // FUTURE: UPSERT INTO gap_register
  if (!_project) return;
  _project.gaps = gaps;
}

export function resetProject(): void {
  _project = null;
}
