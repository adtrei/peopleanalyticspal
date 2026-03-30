/**
 * POST /api/analyze
 * Runs full coverage, gap analysis, and optionally AI analysis.
 */
import { NextRequest, NextResponse } from "next/server";
import { getProject, setCoverageResults, setGaps } from "@/lib/db/store";
import { evaluateAllQuestions } from "@/lib/analytics/coverage";
import { buildGapRegister } from "@/lib/analytics/gaps";

export async function POST(_request: NextRequest) {
  const project = getProject();
  if (!project) {
    return NextResponse.json({ error: "No project loaded" }, { status: 404 });
  }

  const allMappings = project.fieldMappings;
  const allProfiles = project.columnProfiles;
  const datasetIds = project.datasets.map((d) => d.id);

  // Evaluate all business questions
  const coverageResults = evaluateAllQuestions(allMappings, allProfiles, datasetIds);
  setCoverageResults(coverageResults);

  // Get the first quality score (or undefined)
  const qualityScore = Object.values(project.qualityScores)[0];

  // Build gap register
  const gaps = buildGapRegister(coverageResults, qualityScore, allProfiles);
  setGaps(gaps);

  return NextResponse.json({
    success: true,
    coverageResults,
    gaps,
    qualityScore,
  });
}
