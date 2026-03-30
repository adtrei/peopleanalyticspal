/**
 * GET /api/mapping — return current field mappings
 * PUT /api/mapping — update a specific field mapping (user override)
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProject, upsertFieldMappings } from "@/lib/db/store";

export async function GET() {
  const project = getProject();
  if (!project) {
    return NextResponse.json({ error: "No project loaded" }, { status: 404 });
  }
  return NextResponse.json({ mappings: project.fieldMappings });
}

const updateSchema = z.object({
  datasetId: z.string(),
  sourceColumnName: z.string(),
  canonicalFieldName: z.string(),
});

export async function PUT(request: NextRequest) {
  const project = getProject();
  if (!project) {
    return NextResponse.json({ error: "No project loaded" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { datasetId, sourceColumnName, canonicalFieldName } = parsed.data;

  const existing = project.fieldMappings.find(
    (m) => m.datasetId === datasetId && m.sourceColumnName === sourceColumnName
  );
  if (!existing) {
    return NextResponse.json({ error: "Mapping not found" }, { status: 404 });
  }

  upsertFieldMappings([
    {
      ...existing,
      canonicalFieldName,
      mappingConfidence: 1.0,
      approvedByUser: true,
    },
  ]);

  return NextResponse.json({ success: true });
}
