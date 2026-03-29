/**
 * Data profiling engine.
 * Computes column-level statistics from parsed CSV rows.
 */
import type { ColumnProfile, InferredType, DetectedRole } from "@/types";
import { SOURCE_COLUMN_ALIASES } from "@/data/canonicalFields";

const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,           // ISO date
  /^\d{4}-\d{2}$/,                  // Year-Month
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,  // MM/DD/YYYY
  /^\d{4}$/,                         // Year only
];

const CURRENCY_PATTERN = /^\$?[\d,]+(\.\d{1,2})?$/;

function inferType(values: string[]): InferredType {
  const nonEmpty = values.filter((v) => v !== "" && v !== null && v !== undefined);
  if (nonEmpty.length === 0) return "string";

  let dateHits = 0;
  let numHits = 0;
  let currencyHits = 0;
  const uniqueVals = new Set(nonEmpty);

  for (const v of nonEmpty) {
    if (DATE_PATTERNS.some((p) => p.test(v.trim()))) dateHits++;
    if (!isNaN(Number(v.replace(/,/g, ""))) && v.trim() !== "") numHits++;
    if (CURRENCY_PATTERN.test(v.trim())) currencyHits++;
  }

  const total = nonEmpty.length;
  const threshold = 0.8;

  if (dateHits / total >= threshold) return "date";
  if (currencyHits / total >= threshold) return "currency";
  if (numHits / total >= threshold) return "number";

  // Identifier: many unique values that look like codes
  if (uniqueVals.size / total >= 0.9 && total > 20) return "identifier";

  // Categorical: relatively few unique values
  if (uniqueVals.size <= Math.min(30, total * 0.3)) return "categorical";

  return "string";
}

function detectDateParseSuccess(values: string[]): number {
  const nonEmpty = values.filter((v) => v && v.trim() !== "");
  if (nonEmpty.length === 0) return 0;
  const parsed = nonEmpty.filter((v) =>
    DATE_PATTERNS.some((p) => p.test(v.trim())) || !isNaN(Date.parse(v))
  );
  return parsed.length / nonEmpty.length;
}

function detectRole(columnName: string, inferredType: InferredType): DetectedRole {
  const lower = columnName.toLowerCase().trim();
  const alias = SOURCE_COLUMN_ALIASES[lower];
  if (alias) {
    // Map canonical field names to roles
    if (alias === "employee_id") return "employee_id";
    if (alias === "snapshot_month" || alias === "year_month") return "year_month";
    if (alias === "event_date" || alias.includes("date")) return "date";
    if (alias === "status" || alias === "event_type" || alias.includes("flag")) return "status";
    if (alias === "reason" || alias === "reason_code") return "reason";
    if (alias === "annual_salary") return "salary";
    if (alias === "supervisor") return "manager";
    if (alias === "organization" || alias === "department" || alias === "business_line") return "org";
    if (alias === "job" || alias === "job_code") return "job";
    if (alias === "location_code") return "location";
    if (alias === "first_name" || alias === "last_name") return "name";
    if (alias === "department") return "department";
  }

  // Pattern-based fallback
  if (lower.includes("emp") && (lower.includes("id") || lower.includes("no") || lower.includes("num"))) return "employee_id";
  if (lower.includes("year-month") || lower.includes("year_month") || lower.includes("ym")) return "year_month";
  if (inferredType === "date" || lower.includes("date") || lower.includes("dt")) return "date";
  if (lower.includes("salary") || lower.includes("pay") || lower.includes("wage") || inferredType === "currency") return "salary";
  if (lower.includes("manager") || lower.includes("supervisor") || lower.includes("mgr")) return "manager";
  if (lower.includes("dept") || lower.includes("department")) return "department";
  if (lower.includes("org") || lower.includes("division") || lower.includes("unit") || lower.includes("biz")) return "org";
  if (lower.includes("job") || lower.includes("title") || lower.includes("role") || lower.includes("position")) return "job";
  if (lower.includes("status") || lower.includes("type") || lower.includes("class")) return "status";
  if (lower.includes("reason") || lower.includes("cause")) return "reason";
  if (lower.includes("location") || lower.includes("site") || lower.includes("loc")) return "location";
  if (lower.includes("name")) return "name";

  return "unknown";
}

export interface ProfileOptions {
  maxSampleValues?: number;
  maxTopValues?: number;
}

export function profileColumn(
  datasetId: string,
  columnName: string,
  values: string[],
  options: ProfileOptions = {}
): ColumnProfile {
  const { maxSampleValues = 5, maxTopValues = 10 } = options;

  const totalCount = values.length;
  const nullCount = values.filter((v) => v === null || v === undefined || v === "").length;
  const nullRate = totalCount > 0 ? nullCount / totalCount : 0;

  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== "");
  const uniqueVals = new Set(nonEmpty);

  const inferredType = inferType(nonEmpty);
  const detectedRole = detectRole(columnName, inferredType);

  // Sample values — first N unique non-empty
  const sampleValues = Array.from(uniqueVals).slice(0, maxSampleValues);

  // Top values by frequency
  const freqMap = new Map<string, number>();
  for (const v of nonEmpty) {
    freqMap.set(v, (freqMap.get(v) ?? 0) + 1);
  }
  const topValues = Array.from(freqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTopValues)
    .map(([value, count]) => ({
      value,
      count,
      pct: totalCount > 0 ? count / totalCount : 0,
    }));

  const warnings: string[] = [];
  if (nullRate > 0.5) warnings.push(`High null rate: ${(nullRate * 100).toFixed(1)}%`);
  if (nullRate > 0.8) warnings.push("Column is mostly empty — consider excluding");
  if (inferredType === "date" && detectDateParseSuccess(nonEmpty) < 0.9) {
    warnings.push("Some date values could not be parsed");
  }
  if (inferredType === "identifier" && uniqueVals.size < 2) {
    warnings.push("Identifier column has very low cardinality");
  }

  return {
    datasetId,
    sourceColumnName: columnName,
    inferredType,
    nullRate,
    uniqueCount: uniqueVals.size,
    totalCount,
    sampleValues,
    detectedRole,
    warnings,
    dateParseSuccess: inferredType === "date" ? detectDateParseSuccess(nonEmpty) : undefined,
    topValues,
  };
}

export function profileDataset(
  datasetId: string,
  rows: Record<string, string>[],
  options: ProfileOptions = {}
): ColumnProfile[] {
  if (rows.length === 0) return [];

  const columns = Object.keys(rows[0]);
  return columns.map((col) => {
    const values = rows.map((r) => r[col] ?? "");
    return profileColumn(datasetId, col, values, options);
  });
}
