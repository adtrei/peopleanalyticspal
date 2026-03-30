/**
 * GET /api/profile
 * Returns the current project with all column profiles and quality scores.
 */
import { NextResponse } from "next/server";
import { getProject } from "@/lib/db/store";

export async function GET() {
  const project = getProject();
  if (!project) {
    return NextResponse.json({ error: "No project loaded. Upload a file first." }, { status: 404 });
  }
  return NextResponse.json({ project });
}
