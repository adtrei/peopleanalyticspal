/**
 * Headcount analytics — computes monthly trends and segment breakdowns.
 */
import type { HeadcountRow, MonthlyHeadcount } from "@/types";

export function computeMonthlyHeadcount(rows: HeadcountRow[]): MonthlyHeadcount[] {
  const monthMap = new Map<string, { total: Set<string>; byOrg: Map<string, Set<string>>; byDept: Map<string, Set<string>>; byJob: Map<string, Set<string>> }>();

  for (const row of rows) {
    if (!row.snapshotMonth) continue;
    // Only count active employees
    if (row.status && !row.status.toLowerCase().includes("active")) continue;

    if (!monthMap.has(row.snapshotMonth)) {
      monthMap.set(row.snapshotMonth, {
        total: new Set(),
        byOrg: new Map(),
        byDept: new Map(),
        byJob: new Map(),
      });
    }
    const entry = monthMap.get(row.snapshotMonth)!;
    entry.total.add(row.employeeId);

    if (row.organization) {
      if (!entry.byOrg.has(row.organization)) entry.byOrg.set(row.organization, new Set());
      entry.byOrg.get(row.organization)!.add(row.employeeId);
    }
    if (row.department) {
      if (!entry.byDept.has(row.department)) entry.byDept.set(row.department, new Set());
      entry.byDept.get(row.department)!.add(row.employeeId);
    }
    if (row.job) {
      if (!entry.byJob.has(row.job)) entry.byJob.set(row.job, new Set());
      entry.byJob.get(row.job)!.add(row.employeeId);
    }
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, entry]) => ({
      month,
      count: entry.total.size,
      byOrg: Object.fromEntries(Array.from(entry.byOrg.entries()).map(([k, v]) => [k, v.size])),
      byDept: Object.fromEntries(Array.from(entry.byDept.entries()).map(([k, v]) => [k, v.size])),
      byJob: Object.fromEntries(Array.from(entry.byJob.entries()).map(([k, v]) => [k, v.size])),
    }));
}

export function detectHeadcountAnomalies(
  monthly: MonthlyHeadcount[]
): Array<{ month: string; change: number; pctChange: number; flag: string }> {
  const anomalies = [];
  for (let i = 1; i < monthly.length; i++) {
    const prev = monthly[i - 1].count;
    const curr = monthly[i].count;
    const change = curr - prev;
    const pctChange = prev > 0 ? change / prev : 0;
    if (Math.abs(pctChange) > 0.05) {
      anomalies.push({
        month: monthly[i].month,
        change,
        pctChange,
        flag: pctChange > 0 ? "spike" : "drop",
      });
    }
  }
  return anomalies;
}
