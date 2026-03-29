import { evaluateQuestion } from "../lib/analytics/coverage";
import { QUESTION_LIBRARY } from "../data/questionLibrary";
import type { CanonicalFieldMap, ColumnProfile } from "../types";

function makeMappings(fields: string[]): CanonicalFieldMap[] {
  return fields.map((f) => ({
    datasetId: "ds1",
    sourceColumnName: f,
    canonicalFieldName: f,
    mappingConfidence: 0.98,
    approvedByUser: true,
  }));
}

function makeProfiles(fields: string[]): ColumnProfile[] {
  return fields.map((f) => ({
    datasetId: "ds1",
    sourceColumnName: f,
    inferredType: "string",
    nullRate: 0,
    uniqueCount: 100,
    totalCount: 1000,
    sampleValues: ["value"],
    detectedRole: "unknown",
    warnings: [],
  }));
}

describe("evaluateQuestion - monthly headcount", () => {
  const q = QUESTION_LIBRARY.find((q) => q.questionId === "headcount_monthly_active")!;

  it("returns direct when all required fields are available", () => {
    const mappings = makeMappings(["employee_id", "snapshot_month", "status"]);
    const profiles = makeProfiles(["employee_id", "snapshot_month", "status"]);
    const result = evaluateQuestion(q, mappings, profiles, ["ds1"]);
    expect(result.answerability).toBe("direct");
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("returns not_answerable when required fields are missing", () => {
    const mappings = makeMappings(["organization"]); // missing employee_id, snapshot_month, status
    const profiles = makeProfiles(["organization"]);
    const result = evaluateQuestion(q, mappings, profiles, ["ds1"]);
    expect(result.answerability).toBe("not_answerable");
    expect(result.unknowns.length).toBeGreaterThan(0);
  });

  it("returns partial when key fields have high null rate", () => {
    const mappings = makeMappings(["employee_id", "snapshot_month", "status"]);
    const profiles: ColumnProfile[] = [
      { datasetId: "ds1", sourceColumnName: "employee_id", inferredType: "identifier", nullRate: 0, uniqueCount: 100, totalCount: 1000, sampleValues: [], detectedRole: "employee_id", warnings: [] },
      { datasetId: "ds1", sourceColumnName: "snapshot_month", inferredType: "date", nullRate: 0.6, uniqueCount: 12, totalCount: 1000, sampleValues: [], detectedRole: "year_month", warnings: ["High null rate"] },
      { datasetId: "ds1", sourceColumnName: "status", inferredType: "categorical", nullRate: 0, uniqueCount: 3, totalCount: 1000, sampleValues: [], detectedRole: "status", warnings: [] },
    ];
    const result = evaluateQuestion(q, mappings, profiles, ["ds1"]);
    expect(["partial", "not_answerable"]).toContain(result.answerability);
  });
});

describe("evaluateQuestion - why people are leaving", () => {
  const q = QUESTION_LIBRARY.find((q) => q.questionId === "attrition_why_people_leave")!;

  it("returns not_answerable when missing critical fields", () => {
    // Only have basic event fields, missing performance, sentiment, etc.
    const mappings = makeMappings(["employee_id", "event_type", "reason"]);
    const profiles = makeProfiles(["employee_id", "event_type", "reason"]);
    const result = evaluateQuestion(q, mappings, profiles, ["ds1"]);
    expect(result.answerability).toBe("not_answerable");
    expect(result.unknowns.length).toBeGreaterThan(3);
  });
});
