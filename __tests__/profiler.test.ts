import { profileColumn, profileDataset } from "../lib/schema/profiler";

describe("profileColumn", () => {
  it("infers date type for ISO date values", () => {
    const vals = ["2024-01-01", "2024-02-15", "2024-03-20", "2024-04-01", "2024-05-10"];
    const profile = profileColumn("ds1", "effective_date", vals);
    expect(profile.inferredType).toBe("date");
  });

  it("infers number or currency type for numeric values", () => {
    const vals = ["50000", "62000", "75000", "80000", "90000"];
    const profile = profileColumn("ds1", "salary", vals);
    expect(["number", "currency"]).toContain(profile.inferredType);
  });

  it("infers categorical type for low-cardinality strings", () => {
    const vals = Array(20).fill(null).flatMap(() => ["Active", "Inactive", "Leave"]);
    const profile = profileColumn("ds1", "status", vals);
    expect(profile.inferredType).toBe("categorical");
  });

  it("computes null rate correctly", () => {
    const vals = ["A", "B", "", "C", ""];
    const profile = profileColumn("ds1", "col", vals);
    expect(profile.nullRate).toBeCloseTo(0.4);
  });

  it("warns on high null rate", () => {
    const vals = Array(10).fill("").concat(["A"]);
    const profile = profileColumn("ds1", "col", vals);
    expect(profile.warnings.length).toBeGreaterThan(0);
  });

  it("detects employee_id role", () => {
    const vals = ["EMP001", "EMP002", "EMP003"];
    const profile = profileColumn("ds1", "EmpNo", vals);
    expect(profile.detectedRole).toBe("employee_id");
  });

  it("detects salary role", () => {
    const vals = ["75000", "82000", "90000"];
    const profile = profileColumn("ds1", "Annual Salary", vals);
    expect(profile.detectedRole).toBe("salary");
  });
});

describe("profileDataset", () => {
  it("returns one profile per column", () => {
    const rows = [
      { empno: "E1", status: "Active", salary: "50000" },
      { empno: "E2", status: "Inactive", salary: "60000" },
    ];
    const profiles = profileDataset("ds1", rows);
    expect(profiles.length).toBe(3);
    expect(profiles.map((p) => p.sourceColumnName)).toEqual(["empno", "status", "salary"]);
  });

  it("handles empty dataset", () => {
    const profiles = profileDataset("ds1", []);
    expect(profiles).toEqual([]);
  });
});
