/**
 * POST /api/upload
 * Accepts one or more CSV files, parses them, and stores dataset + column profiles.
 */
import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";
import type { Dataset, DatasetSourceType } from "@/types";
import { profileDataset } from "@/lib/schema/profiler";
import { suggestMappings } from "@/lib/schema/mapper";
import { runQualityChecks } from "@/lib/quality/engine";
import {
  initProject,
  upsertDataset,
  upsertColumnProfiles,
  upsertFieldMappings,
  setQualityScore,
  getProject,
} from "@/lib/db/store";

function detectSourceType(filename: string): DatasetSourceType {
  const lower = filename.toLowerCase();
  if (lower.includes("headcount") || lower.includes("snapshot")) return "hcm_snapshot";
  if (lower.includes("hire") || lower.includes("term") || lower.includes("event")) return "workforce_event";
  if (lower.includes("ats") || lower.includes("recruit")) return "ats_event";
  if (lower.includes("survey") || lower.includes("engagement")) return "survey";
  if (lower.includes("schema") || lower.includes("manifest") || lower.includes("fields")) return "schema_manifest";
  return "hcm_snapshot";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const maxMB = parseInt(process.env.MAX_UPLOAD_MB ?? "50");

    if (!getProject()) {
      initProject("Workforce Analytics Project");
    }

    const uploadedDatasets: Dataset[] = [];

    for (const file of files) {
      if (file.size > maxMB * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds ${maxMB}MB limit` },
          { status: 400 }
        );
      }

      const text = await file.text();

      // Parse CSV
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim(),
      });

      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        return NextResponse.json(
          { error: `Could not parse ${file.name}: ${parsed.errors[0]?.message}` },
          { status: 400 }
        );
      }

      const rows = parsed.data as Record<string, string>[];
      const datasetId = uuidv4();
      const sourceType = detectSourceType(file.name);

      const dataset: Dataset = {
        id: datasetId,
        name: file.name,
        sourceType,
        uploadedAt: new Date().toISOString(),
        rowCount: rows.length,
        columnCount: rows.length > 0 ? Object.keys(rows[0]).length : 0,
        fileSizeBytes: file.size,
        columns: rows.length > 0 ? Object.keys(rows[0]) : [],
      };

      const profiles = profileDataset(datasetId, rows);
      const mappings = suggestMappings(datasetId, profiles);
      const qualityScore = runQualityChecks(profiles, mappings, rows);

      upsertDataset(dataset);
      upsertColumnProfiles(profiles);
      upsertFieldMappings(mappings);
      setQualityScore(datasetId, qualityScore);

      uploadedDatasets.push(dataset);
    }

    return NextResponse.json({
      success: true,
      datasets: uploadedDatasets,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please check the file format and try again." },
      { status: 500 }
    );
  }
}
