import {
  classifyVoluntary,
  computeMonthlyEvents,
  computeTerminationReasons,
  computeVoluntaryInvoluntarySplit,
  computeTenureBuckets,
} from "../lib/analytics/attrition";
import type { WorkforceEventRow, HeadcountRow } from "../types";

// ─── classifyVoluntary ─────────────────────────────────────────────────────

describe("classifyVoluntary", () => {
  it("classifies resignation as voluntary", () => {
    expect(classifyVoluntary("Resignation - Personal")).toBe("voluntary");
    expect(classifyVoluntary("resignation")).toBe("voluntary");
    expect(classifyVoluntary("Retirement")).toBe("voluntary");
  });

  it("classifies layoff as involuntary", () => {
    expect(classifyVoluntary("Involuntary - Performance")).toBe("involuntary");
    expect(classifyVoluntary("layoff")).toBe("involuntary");
    expect(classifyVoluntary("RIF")).toBe("involuntary");
  });

  it("returns unknown for ambiguous reasons", () => {
    expect(classifyVoluntary("Other")).toBe("unknown");
    expect(classifyVoluntary(undefined)).toBe("unknown");
    expect(classifyVoluntary("")).toBe("unknown");
  });
});

// ─── computeMonthlyEvents ─────────────────────────────────────────────────

describe("computeMonthlyEvents", () => {
  const events: WorkforceEventRow[] = [
    { employeeId: "E1", eventDate: "2024-03-15", eventMonth: "2024-03", eventType: "hire" },
    { employeeId: "E2", eventDate: "2024-03-20", eventMonth: "2024-03", eventType: "termination", reason: "Resignation" },
    { employeeId: "E3", eventDate: "2024-03-01", eventMonth: "2024-03", eventType: "transfer_in" },
    { employeeId: "E4", eventDate: "2024-03-01", eventMonth: "2024-03", eventType: "transfer_out" },
    { employeeId: "E5", eventDate: "2024-04-10", eventMonth: "2024-04", eventType: "hire" },
  ];

  it("separates hires, terminations, and transfers", () => {
    const monthly = computeMonthlyEvents(events);
    const march = monthly.find((m) => m.month === "2024-03")!;
    expect(march.hires).toBe(1);
    expect(march.terminations).toBe(1);
    expect(march.transfersIn).toBe(1);
    expect(march.transfersOut).toBe(1);
  });

  it("calculates net external correctly (excludes transfers)", () => {
    const monthly = computeMonthlyEvents(events);
    const march = monthly.find((m) => m.month === "2024-03")!;
    // net = hires - terminations (NOT counting transfers)
    expect(march.netExternal).toBe(0); // 1 hire - 1 termination
  });

  it("sorts results by month", () => {
    const monthly = computeMonthlyEvents(events);
    expect(monthly[0].month).toBe("2024-03");
    expect(monthly[1].month).toBe("2024-04");
  });
});

// ─── computeTerminationReasons ────────────────────────────────────────────

describe("computeTerminationReasons", () => {
  const events: WorkforceEventRow[] = [
    { employeeId: "E1", eventDate: "2024-03-01", eventMonth: "2024-03", eventType: "termination", reason: "Resignation - Personal" },
    { employeeId: "E2", eventDate: "2024-03-02", eventMonth: "2024-03", eventType: "termination", reason: "Resignation - Personal" },
    { employeeId: "E3", eventDate: "2024-03-03", eventMonth: "2024-03", eventType: "termination", reason: "Involuntary - Performance" },
    { employeeId: "E4", eventDate: "2024-03-04", eventMonth: "2024-03", eventType: "hire" }, // should be excluded
  ];

  it("only counts terminations", () => {
    const reasons = computeTerminationReasons(events);
    const total = reasons.reduce((a, r) => a + r.count, 0);
    expect(total).toBe(3); // 3 terminations, not the hire
  });

  it("sorts by count descending", () => {
    const reasons = computeTerminationReasons(events);
    expect(reasons[0].reason).toBe("Resignation - Personal");
    expect(reasons[0].count).toBe(2);
  });

  it("infers voluntary classification", () => {
    const reasons = computeTerminationReasons(events);
    const res = reasons.find((r) => r.reason === "Resignation - Personal")!;
    expect(res.inferredVoluntary).toBe("voluntary");
  });
});

// ─── computeVoluntaryInvoluntarySplit ─────────────────────────────────────

describe("computeVoluntaryInvoluntarySplit", () => {
  it("correctly sums voluntary/involuntary/unknown", () => {
    const reasons = [
      { reason: "Resignation", count: 10, pct: 0.5, inferredVoluntary: "voluntary" as const },
      { reason: "Laid Off", count: 5, pct: 0.25, inferredVoluntary: "involuntary" as const },
      { reason: "Other", count: 5, pct: 0.25, inferredVoluntary: "unknown" as const },
    ];
    const split = computeVoluntaryInvoluntarySplit(reasons);
    expect(split.voluntary).toBe(10);
    expect(split.involuntary).toBe(5);
    expect(split.unknown).toBe(5);
  });
});

// ─── computeTenureBuckets ─────────────────────────────────────────────────

describe("computeTenureBuckets", () => {
  const headcount: HeadcountRow[] = [
    { employeeId: "E1", snapshotMonth: "2024-01", dateOfLastHire: "2023-10-01" }, // 3 months before exit
    { employeeId: "E2", snapshotMonth: "2024-01", dateOfLastHire: "2022-01-01" }, // ~24 months before exit
  ];

  const events: WorkforceEventRow[] = [
    { employeeId: "E1", eventDate: "2024-01-01", eventMonth: "2024-01", eventType: "termination" },
    { employeeId: "E2", eventDate: "2024-01-01", eventMonth: "2024-01", eventType: "termination" },
  ];

  it("places employees in correct tenure buckets", () => {
    const buckets = computeTenureBuckets(events, headcount);
    // E1: ~3 months → "3–6 months" bucket
    // E2: ~24 months → "2–5 years" bucket (24 months)
    const bucket3to6 = buckets.find((b) => b.label === "3–6 months")!;
    expect(bucket3to6.count).toBe(1);
  });

  it("handles missing hire date gracefully", () => {
    const noHireEvents: WorkforceEventRow[] = [
      { employeeId: "UNKNOWN", eventDate: "2024-01-01", eventMonth: "2024-01", eventType: "termination" },
    ];
    expect(() => computeTenureBuckets(noHireEvents, [])).not.toThrow();
  });
});
