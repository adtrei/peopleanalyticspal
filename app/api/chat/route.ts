/**
 * POST /api/chat
 * AI analyst chat endpoint — server-side only, never exposes API key.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chat, isMockMode } from "@/lib/ai/client";
import { getProject } from "@/lib/db/store";

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .default([]),
});

export async function POST(request: NextRequest) {
  const project = getProject();
  const body = await request.json();

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { message, history } = parsed.data;

  const context = {
    datasets: project?.datasets.map((d) => d.name) ?? [],
    topInsights: project?.coverageResults
      .filter((r) => r.answerability === "direct")
      .slice(0, 3)
      .map((r) => r.questionText) ?? [],
    qualityScore: Object.values(project?.qualityScores ?? {})
      .map((s) => s.overall)
      .reduce((a, b) => a + b, 0) / Math.max(Object.keys(project?.qualityScores ?? {}).length, 1),
    coverageSummary: project
      ? `${project.coverageResults.filter((r) => r.answerability === "direct").length}/${project.coverageResults.length} questions directly answerable`
      : "No data loaded",
  };

  const response = await chat(message, history, context);

  return NextResponse.json({
    response,
    isMockMode: isMockMode(),
  });
}
