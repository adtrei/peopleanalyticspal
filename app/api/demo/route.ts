/**
 * POST /api/demo
 * Loads sample data for demo mode without requiring file upload.
 */
import { NextResponse } from "next/server";
import { generateSampleHeadcount, generateSampleEvents } from "@/data/sampleData";
import { v4 as uuidv4 } from "uuid";
import type { Dataset } from "@/types";
import { profileDataset } from "@/lib/schema/profiler";
import { suggestMappings } from "@/lib/schema/mapper";
import { runQualityChecks } from "@/lib/quality/engine";
import { evaluateAllQuestions } from "@/lib/analytics/coverage";
import { buildGapRegister } from "@/lib/analytics/gaps";
import {
  initProject,
  upsertDataset,
  upsertColumnProfiles,
  upsertFieldMappings,
  setQualityScore,
  setCoverageResults,
  setGaps,
} from "@/lib/db/store";

export async function POST() {
  initProject("Demo: AcmeCorp Workforce Analytics");

  // Generate sample data
  const headcountRows = generateSampleHeadcount();
  const eventRows = generateSampleEvents();

  // Convert to CSV-row format
  function toRows(records: object[]): Record<string, string>[] {
    return records.map((r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, v === undefined || v === null ? "" : String(v)])
      )
    );
  }

  // Map sample data keys to headcount column names
  const hcRows = headcountRows.map((r) => ({
    "EmpNo": r.employeeId,
    "First Name": r.firstName ?? "",
    "Last Name": r.lastName ?? "",
    "Status": r.status ?? "Active",
    "Year-Month": r.snapshotMonth,
    "Company Code": r.companyCode ?? "",
    "Company": r.company ?? "",
    "ejhorglvl1": r.organization ?? "",
    "Organization": r.organization ?? "",
    "ejhorglvl2": r.department ?? "",
    "Department": r.department ?? "",
    "ejhorglvl3": r.businessLine ?? "",
    "Business Line": r.businessLine ?? "",
    "Project": r.project ?? "",
    "Location Code": r.locationCode ?? "",
    "JobCode": r.jobCode ?? "",
    "Job": r.job ?? "",
    "FLSA Type": r.flsaType ?? "",
    "FT or PT": r.ftOrPt ?? "",
    "LocalUnion": r.localUnion ?? "",
    "EE Type": r.employeeType ?? "",
    "Supervisor": r.supervisor ?? "",
    "Date of Seniority": r.dateOfSeniority ?? "",
    "Date of Last Hire": r.dateOfLastHire ?? "",
    "Date of Original Hire": r.dateOfOriginalHire ?? "",
  }));

  const evRows = eventRows.map((r) => ({
    "Type": r.eventType === "hire" ? "Hire" : r.eventType === "termination" ? "Termination" : r.eventType === "transfer_in" ? "Transferred in" : "Transferred out",
    "Employee Number": r.employeeId,
    "Effective Date": r.eventDate,
    "Year-Month": r.eventMonth,
    "Company Code": r.companyCode ?? "",
    "Employee Status Code": r.eventType,
    "Reason Code": r.reasonCode ?? "",
    "Reason": r.reason ?? "",
    "EjhOrgLvl1": r.organization ?? "",
    "Organization": r.organization ?? "",
    "EjhOrgLvl2": r.department ?? "",
    "Department": r.department ?? "",
    "EjhOrgLvl3": r.businessLine ?? "",
    "Business Line": r.businessLine ?? "",
    "Job Code": r.jobCode ?? "",
    "Job": r.job ?? "",
    "Employee Type": r.employeeType ?? "",
    "Annual Salary": r.annualSalary ? String(r.annualSalary) : "",
  }));

  const hcDatasetId = uuidv4();
  const evDatasetId = uuidv4();

  const datasets: Dataset[] = [
    {
      id: hcDatasetId,
      name: "Demo_Headcount_Snapshot.csv",
      sourceType: "hcm_snapshot",
      uploadedAt: new Date().toISOString(),
      rowCount: hcRows.length,
      columnCount: Object.keys(hcRows[0] ?? {}).length,
      fileSizeBytes: 0,
      columns: Object.keys(hcRows[0] ?? {}),
    },
    {
      id: evDatasetId,
      name: "Demo_Hires_and_Terms.csv",
      sourceType: "workforce_event",
      uploadedAt: new Date().toISOString(),
      rowCount: evRows.length,
      columnCount: Object.keys(evRows[0] ?? {}).length,
      fileSizeBytes: 0,
      columns: Object.keys(evRows[0] ?? {}),
    },
  ];

  for (const ds of datasets) {
    const rows = ds.id === hcDatasetId ? toRows(hcRows) : toRows(evRows);
    const profiles = profileDataset(ds.id, rows);
    const mappings = suggestMappings(ds.id, profiles);
    const qualityScore = runQualityChecks(profiles, mappings, rows);

    upsertDataset(ds);
    upsertColumnProfiles(profiles);
    upsertFieldMappings(mappings);
    setQualityScore(ds.id, qualityScore);
  }

  // Run analysis
  const { getProject } = await import("@/lib/db/store");
  const project = getProject()!;
  const coverageResults = evaluateAllQuestions(
    project.fieldMappings,
    project.columnProfiles,
    [hcDatasetId, evDatasetId]
  );
  setCoverageResults(coverageResults);

  const qualityScore = project.qualityScores[hcDatasetId];
  const gaps = buildGapRegister(coverageResults, qualityScore, project.columnProfiles);
  setGaps(gaps);

  return NextResponse.json({ success: true, datasets });
}
