import { suggestMappings } from "../lib/schema/mapper";
import type { ColumnProfile } from "../types";

function makeProfile(colName: string, role: string = "unknown"): ColumnProfile {
  return {
    datasetId: "ds1",
    sourceColumnName: colName,
    inferredType: "string",
    nullRate: 0,
    uniqueCount: 100,
    totalCount: 1000,
    sampleValues: [],
    detectedRole: role as ColumnProfile["detectedRole"],
    warnings: [],
  };
}

describe("suggestMappings", () => {
  it("maps known aliases exactly", () => {
    const profiles = [
      makeProfile("EmpNo"),
      makeProfile("Year-Month"),
      makeProfile("Annual Salary"),
    ];
    const mappings = suggestMappings("ds1", profiles);
    expect(mappings.find((m) => m.sourceColumnName === "EmpNo")?.canonicalFieldName).toBe("employee_id");
    expect(mappings.find((m) => m.sourceColumnName === "Year-Month")?.canonicalFieldName).toBe("snapshot_month");
    expect(mappings.find((m) => m.sourceColumnName === "Annual Salary")?.canonicalFieldName).toBe("annual_salary");
  });

  it("gives high confidence for exact alias matches", () => {
    const profiles = [makeProfile("EmpNo")];
    const mappings = suggestMappings("ds1", profiles);
    expect(mappings[0].mappingConfidence).toBeGreaterThan(0.9);
  });

  it("handles completely unknown columns gracefully", () => {
    const profiles = [makeProfile("xyzRandomField999")];
    const mappings = suggestMappings("ds1", profiles);
    expect(mappings[0].canonicalFieldName).toBeDefined();
    // Should either be "unknown" or a low-confidence guess
  });

  it("maps ejhorglvl1 to organization", () => {
    const profiles = [makeProfile("ejhorglvl1")];
    const mappings = suggestMappings("ds1", profiles);
    expect(mappings[0].canonicalFieldName).toBe("organization");
  });
});
