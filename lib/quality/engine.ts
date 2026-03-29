/**
 * Data quality engine.
 * Runs a suite of quality checks and produces a scored quality report.
 */
import type {
  DataQualityCheck,
  DataQualityScore,
  ColumnProfile,
  CanonicalFieldMap,
  QualityDimension,
} from "@/types";

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function runQualityChecks(
  profiles: ColumnProfile[],
  mappings: CanonicalFieldMap[],
  rows: Record<string, string>[]
): DataQualityScore {
  const checks: DataQualityCheck[] = [];
  const mappingIndex = new Map(mappings.map((m) => [m.sourceColumnName, m]));

  // ─── Schema checks ───────────────────────────────────────────────────────
  const employeeIdProfile = profiles.find(
    (p) => mappingIndex.get(p.sourceColumnName)?.canonicalFieldName === "employee_id"
  );
  if (!employeeIdProfile) {
    checks.push({
      entity: "dataset",
      dimension: "schema",
      rule: "Employee ID column must be present",
      status: "fail",
      severity: "critical",
      evidence: "No column mapped to employee_id",
    });
  } else if (employeeIdProfile.nullRate > 0) {
    checks.push({
      entity: employeeIdProfile.sourceColumnName,
      dimension: "schema",
      rule: "Employee ID must be non-null",
      status: employeeIdProfile.nullRate > 0.01 ? "fail" : "warn",
      severity: employeeIdProfile.nullRate > 0.01 ? "high" : "medium",
      evidence: `${(employeeIdProfile.nullRate * 100).toFixed(1)}% null rate`,
    });
  } else {
    checks.push({
      entity: employeeIdProfile.sourceColumnName,
      dimension: "schema",
      rule: "Employee ID column present and non-null",
      status: "pass",
      severity: "low",
      evidence: "OK",
    });
  }

  // ─── Missingness checks ──────────────────────────────────────────────────
  for (const profile of profiles) {
    if (profile.nullRate > 0.5) {
      checks.push({
        entity: profile.sourceColumnName,
        dimension: "missingness",
        rule: "Column should have < 50% null rate",
        status: "warn",
        severity: profile.nullRate > 0.8 ? "high" : "medium",
        evidence: `${(profile.nullRate * 100).toFixed(1)}% null`,
        affectedColumns: [profile.sourceColumnName],
      });
    }
  }

  // ─── Uniqueness / duplicates check ───────────────────────────────────────
  const snapshotMonthCol = profiles.find(
    (p) => mappingIndex.get(p.sourceColumnName)?.canonicalFieldName === "snapshot_month"
  );
  if (snapshotMonthCol && employeeIdProfile && rows.length > 0) {
    const keySet = new Set<string>();
    let dupCount = 0;
    for (const row of rows) {
      const key = `${row[employeeIdProfile.sourceColumnName]}|${row[snapshotMonthCol.sourceColumnName]}`;
      if (keySet.has(key)) dupCount++;
      else keySet.add(key);
    }
    if (dupCount > 0) {
      checks.push({
        entity: "headcount_snapshot",
        dimension: "uniqueness",
        rule: "Employee + snapshot month must be unique",
        status: dupCount > rows.length * 0.01 ? "fail" : "warn",
        severity: dupCount > rows.length * 0.01 ? "high" : "medium",
        evidence: `${dupCount} duplicate employee+month combinations found — check for overlapping snapshot files`,
      });
    } else {
      checks.push({
        entity: "headcount_snapshot",
        dimension: "uniqueness",
        rule: "Employee + snapshot month uniqueness",
        status: "pass",
        severity: "low",
        evidence: "No duplicates found",
      });
    }
  }

  // ─── Integrity / event type check ────────────────────────────────────────
  const eventTypeCol = profiles.find(
    (p) => mappingIndex.get(p.sourceColumnName)?.canonicalFieldName === "event_type"
  );
  if (eventTypeCol) {
    const knownTypes = new Set([
      "hire", "termination", "transferred in", "transferred out",
      "rehire", "transfer in", "transfer out",
    ]);
    const unknownTypes = (eventTypeCol.topValues ?? []).filter(
      (v) => !knownTypes.has(v.value.toLowerCase())
    );
    if (unknownTypes.length > 0) {
      checks.push({
        entity: eventTypeCol.sourceColumnName,
        dimension: "integrity",
        rule: "Event types should map to known taxonomy",
        status: "warn",
        severity: "medium",
        evidence: `Unrecognized event types: ${unknownTypes
          .slice(0, 3)
          .map((u) => u.value)
          .join(", ")}`,
        affectedColumns: [eventTypeCol.sourceColumnName],
      });
    }
  }

  // ─── Freshness / temporal continuity check ───────────────────────────────
  const monthProfile = snapshotMonthCol ?? profiles.find(
    (p) => mappingIndex.get(p.sourceColumnName)?.canonicalFieldName === "event_date"
  );
  if (monthProfile && monthProfile.topValues && monthProfile.topValues.length > 0) {
    checks.push({
      entity: monthProfile.sourceColumnName,
      dimension: "freshness",
      rule: "Temporal coverage should be continuous",
      status: "pass",
      severity: "low",
      evidence: `${monthProfile.uniqueCount} distinct time periods found`,
    });
  }

  // ─── Transfer normalization warning ─────────────────────────────────────
  if (eventTypeCol) {
    const transferValues = (eventTypeCol.topValues ?? []).filter((v) =>
      v.value.toLowerCase().includes("transfer")
    );
    if (transferValues.length > 0) {
      const transferTotal = transferValues.reduce((a, b) => a + b.count, 0);
      checks.push({
        entity: eventTypeCol.sourceColumnName,
        dimension: "integrity",
        rule: "Internal transfers must be excluded from net attrition calculations",
        status: "warn",
        severity: "high",
        evidence: `${transferTotal} transfer events detected. These inflate both hire and term counts if not normalized.`,
      });
    }
  }

  // ─── Volume check ─────────────────────────────────────────────────────────
  if (rows.length < 10) {
    checks.push({
      entity: "dataset",
      dimension: "volume",
      rule: "Dataset should have at least 10 rows for meaningful analysis",
      status: "warn",
      severity: "high",
      evidence: `Only ${rows.length} rows present`,
    });
  } else {
    checks.push({
      entity: "dataset",
      dimension: "volume",
      rule: "Dataset volume",
      status: "pass",
      severity: "low",
      evidence: `${rows.length} rows`,
    });
  }

  // ─── Compute dimension scores ─────────────────────────────────────────────
  const dimensionList: QualityDimension[] = [
    "schema", "missingness", "uniqueness", "volume", "freshness", "integrity", "distribution",
  ];
  const dimensionScores: Record<QualityDimension, number> = {} as Record<QualityDimension, number>;

  for (const dim of dimensionList) {
    const dimChecks = checks.filter((c) => c.dimension === dim);
    if (dimChecks.length === 0) {
      dimensionScores[dim] = 100;
    } else {
      const scores = dimChecks.map((c) => {
        if (c.status === "pass") return 100;
        if (c.status === "warn") return c.severity === "high" ? 60 : 75;
        // fail
        return c.severity === "critical" ? 0 : 40;
      });
      dimensionScores[dim] = avg(scores);
    }
  }

  const overall = Math.round(avg(Object.values(dimensionScores)));

  const criticalWarnings = checks
    .filter((c) => c.status === "fail" || (c.status === "warn" && c.severity === "high"))
    .map((c) => c.evidence);

  const safeFor: string[] = [];
  if (overall >= 70) safeFor.push("trending");
  if (overall >= 75) safeFor.push("segmentation");
  if (overall >= 80) safeFor.push("executive reporting");
  if (overall >= 90) safeFor.push("experimentation");

  return {
    overall,
    dimensions: dimensionScores,
    checks,
    safeFor,
    criticalWarnings,
  };
}
