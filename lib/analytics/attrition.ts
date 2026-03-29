/**
 * Attrition analytics.
 *
 * Key business rule: Internal transfers (transfer_in / transfer_out) are
 * NOT true attrition and must be separated from external net staffing changes.
 */
import type {
  WorkforceEventRow,
  MonthlyEvent,
  TerminationReasonSummary,
  TenureBucket,
  HeadcountRow,
} from "@/types";

const VOLUNTARY_REASONS = new Set([
  "resignation",
  "resignation - personal",
  "resignation - career growth",
  "resignation - compensation",
  "resigned",
  "voluntary",
  "retirement",
  "personal reasons",
]);

const INVOLUNTARY_REASONS = new Set([
  "involuntary",
  "termination",
  "involuntary - performance",
  "involuntary - position eliminated",
  "layoff",
  "rif",
  "reduction in force",
  "fired",
  "dismissed",
  "contract end",
]);

export function classifyVoluntary(
  reason: string | undefined
): "voluntary" | "involuntary" | "unknown" {
  if (!reason) return "unknown";
  const lower = reason.toLowerCase().trim();
  if (VOLUNTARY_REASONS.has(lower) || lower.startsWith("resignation")) return "voluntary";
  if (INVOLUNTARY_REASONS.has(lower) || lower.startsWith("involuntary")) return "involuntary";
  return "unknown";
}

/**
 * Compute monthly hire/term/transfer events.
 * Transfers are tracked separately to avoid distorting net headcount math.
 */
export function computeMonthlyEvents(events: WorkforceEventRow[]): MonthlyEvent[] {
  const monthMap = new Map<
    string,
    { hires: Set<string>; terms: Set<string>; transfersIn: Set<string>; transfersOut: Set<string> }
  >();

  for (const event of events) {
    const month = event.eventMonth;
    if (!month) continue;

    if (!monthMap.has(month)) {
      monthMap.set(month, {
        hires: new Set(),
        terms: new Set(),
        transfersIn: new Set(),
        transfersOut: new Set(),
      });
    }
    const entry = monthMap.get(month)!;

    switch (event.eventType) {
      case "hire":
      case "rehire":
        entry.hires.add(event.employeeId);
        break;
      case "termination":
        entry.terms.add(event.employeeId);
        break;
      case "transfer_in":
        entry.transfersIn.add(event.employeeId);
        break;
      case "transfer_out":
        entry.transfersOut.add(event.employeeId);
        break;
    }
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, e]) => ({
      month,
      hires: e.hires.size,
      terminations: e.terms.size,
      transfersIn: e.transfersIn.size,
      transfersOut: e.transfersOut.size,
      // Net external = hires minus true terminations (excludes transfers)
      netExternal: e.hires.size - e.terms.size,
    }));
}

export function computeTerminationReasons(events: WorkforceEventRow[]): TerminationReasonSummary[] {
  const terms = events.filter(
    (e) => e.eventType === "termination"
  );
  const total = terms.length;
  if (total === 0) return [];

  const reasonMap = new Map<string, number>();
  for (const e of terms) {
    const reason = e.reason ?? "Unknown";
    reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);
  }

  return Array.from(reasonMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => ({
      reason,
      count,
      pct: count / total,
      inferredVoluntary: classifyVoluntary(reason),
    }));
}

export function computeVoluntaryInvoluntarySplit(
  reasons: TerminationReasonSummary[]
): { voluntary: number; involuntary: number; unknown: number } {
  let voluntary = 0;
  let involuntary = 0;
  let unknown = 0;
  for (const r of reasons) {
    if (r.inferredVoluntary === "voluntary") voluntary += r.count;
    else if (r.inferredVoluntary === "involuntary") involuntary += r.count;
    else unknown += r.count;
  }
  return { voluntary, involuntary, unknown };
}

export function computeTenureBuckets(
  events: WorkforceEventRow[],
  headcount: HeadcountRow[]
): TenureBucket[] {
  const hireIndex = new Map<string, string>();
  for (const row of headcount) {
    if (row.dateOfLastHire && !hireIndex.has(row.employeeId)) {
      hireIndex.set(row.employeeId, row.dateOfLastHire);
    }
  }

  const terms = events.filter((e) => e.eventType === "termination");
  const tenureMonths: number[] = [];

  for (const event of terms) {
    const hireDate = hireIndex.get(event.employeeId);
    if (!hireDate) continue;
    const hire = new Date(hireDate);
    const exit = new Date(event.eventDate);
    if (isNaN(hire.getTime()) || isNaN(exit.getTime())) continue;
    const months = (exit.getFullYear() - hire.getFullYear()) * 12 + (exit.getMonth() - hire.getMonth());
    if (months >= 0) tenureMonths.push(months);
  }

  const buckets: Array<{ label: string; min: number; max: number }> = [
    { label: "< 3 months", min: 0, max: 3 },
    { label: "3–6 months", min: 3, max: 6 },
    { label: "6–12 months", min: 6, max: 12 },
    { label: "1–2 years", min: 12, max: 24 },
    { label: "2–5 years", min: 24, max: 60 },
    { label: "5+ years", min: 60, max: Infinity },
  ];

  const total = tenureMonths.length;
  return buckets.map(({ label, min, max }) => {
    const count = tenureMonths.filter((m) => m >= min && m < max).length;
    return { label, minMonths: min, maxMonths: max, count, pct: total > 0 ? count / total : 0 };
  });
}
