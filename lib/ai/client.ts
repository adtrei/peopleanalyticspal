/**
 * OpenAI AI client — server-side only.
 * Falls back to mock mode when OPENAI_API_KEY is not set.
 */
import type {
  AIAnalysisOutput,
  CanonicalFieldMap,
  ColumnProfile,
  QuestionCoverageResult,
  DataQualityScore,
  GapItem,
} from "@/types";

const SYSTEM_PROMPT = `You are a senior people analytics architect and workforce decision-support analyst.
Your job is to assess what can and cannot be responsibly concluded from uploaded workforce data.

Rules:
- Separate direct observation, derivation, assumption, and absence.
- Never imply causation from descriptive correlations.
- Never invent fields that are not present.
- If a business question cannot be answered, explain why in plain language.
- Recommend the smallest set of new fields, process changes, or governance steps that would improve answerability.
- Optimize for executive clarity, methodological honesty, and practical next actions.
- Prefer concise, structured outputs.
- Always return valid JSON matching the schema provided.`;

// ─── Mock responses ──────────────────────────────────────────────────────────

function mockAnalysisOutput(questionId: string): AIAnalysisOutput {
  return {
    questionId,
    answerability: "partial",
    confidence: 0.65,
    knowns: [
      {
        concept: "Termination events",
        status: "known",
        evidenceFields: ["Type", "Reason"],
        qualityNotes: ["Reason codes present but may be coarse"],
      },
    ],
    unknowns: [
      {
        concept: "Exit sentiment",
        status: "unknown",
        whyMissing: "No exit survey or interview data present in uploaded files",
      },
      {
        concept: "Performance context",
        status: "unknown",
        whyMissing: "No performance rating field found in HR exports",
      },
    ],
    assumptions: [
      "Voluntary/involuntary classification inferred from reason text mapping",
      "Tenure derived from date of last hire vs event date",
    ],
    qualityRisks: [
      "Internal transfers appear in event data and must be excluded from true attrition counts",
    ],
    recommendations: [
      {
        type: "process",
        priority: "high",
        action: "Capture standardized regrettable/non-regrettable flag at termination",
        estimatedEffort: "low",
      },
      {
        type: "data",
        priority: "high",
        action: "Add structured exit survey capturing reason, sentiment, and manager relationship quality",
        estimatedEffort: "high",
      },
    ],
    executiveSummary:
      "[MOCK MODE] The dataset supports basic attrition reporting but does not support a reliable explanation of why employees leave beyond coarse coded reasons. This response was generated without an OpenAI API key.",
  };
}

function mockChatResponse(userMessage: string): string {
  return `[MOCK MODE — No OpenAI API key configured]

I can see you asked: "${userMessage}"

In a live environment, I would analyze the uploaded workforce data and provide a structured response distinguishing:

**Known** — what the data directly supports
**Derived** — what can be inferred with transparent logic
**Assumed** — what requires a business rule or classification
**Unknown** — what is not captured or too unreliable

To enable real AI analysis, add your OpenAI API key to the \`.env.local\` file:
\`\`\`
OPENAI_API_KEY=sk-...
\`\`\``;
}

function mockExecutiveSummary(
  qualityScore: number,
  answerableCount: number,
  totalQuestions: number,
  topGaps: GapItem[]
): string {
  return `[MOCK MODE] This organization has ${answerableCount} of ${totalQuestions} business questions answerable with current data. The overall data quality score is ${qualityScore}/100. The top data gaps are: ${topGaps.slice(0, 3).map((g) => g.title).join("; ")}.`;
}

// ─── Real OpenAI calls ────────────────────────────────────────────────────────

async function callOpenAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const response = await client.chat.completions.create({
    model,
    messages: messages as Parameters<typeof client.chat.completions.create>[0]["messages"],
    temperature: 0.1,
  });

  return response.choices[0]?.message?.content ?? "";
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function isMockMode(): boolean {
  return !process.env.OPENAI_API_KEY;
}

export async function analyzeQuestion(
  questionId: string,
  questionText: string,
  mappings: CanonicalFieldMap[],
  profiles: ColumnProfile[],
  coverageResult: QuestionCoverageResult
): Promise<AIAnalysisOutput> {
  if (isMockMode()) return mockAnalysisOutput(questionId);

  const prompt = `Analyze the following workforce analytics question using the available data schema.

Question: "${questionText}"

Available field mappings (source → canonical):
${mappings
  .filter((m) => m.canonicalFieldName !== "unknown")
  .map((m) => `- ${m.sourceColumnName} → ${m.canonicalFieldName} (confidence: ${(m.mappingConfidence * 100).toFixed(0)}%)`)
  .join("\n")}

Pre-computed coverage assessment:
- Answerability: ${coverageResult.answerability}
- Known concepts: ${coverageResult.knowns.map((k) => k.concept).join(", ")}
- Unknown concepts: ${coverageResult.unknowns.map((u) => u.concept).join(", ")}

Return a JSON object with this exact schema:
{
  "question_id": string,
  "answerability": "direct" | "partial" | "not_answerable",
  "confidence": number (0-1),
  "knowns": [{ "concept": string, "status": "known"|"derived"|"assumed", "evidence_fields": string[], "quality_notes": string[] }],
  "unknowns": [{ "concept": string, "status": "unknown"|"contested", "why_missing": string }],
  "assumptions": string[],
  "quality_risks": string[],
  "recommendations": [{ "type": "data"|"quality"|"process"|"capability", "priority": "critical"|"high"|"medium"|"low", "action": string }],
  "executive_summary": string
}`;

  try {
    const raw = await callOpenAI([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ]);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      questionId: parsed.question_id ?? questionId,
      answerability: parsed.answerability ?? coverageResult.answerability,
      confidence: parsed.confidence ?? coverageResult.confidence,
      knowns: (parsed.knowns ?? []).map((k: Record<string, unknown>) => ({
        concept: k.concept,
        status: k.status,
        evidenceFields: k.evidence_fields ?? [],
        qualityNotes: k.quality_notes ?? [],
      })),
      unknowns: (parsed.unknowns ?? []).map((u: Record<string, unknown>) => ({
        concept: u.concept,
        status: u.status,
        whyMissing: u.why_missing ?? "",
      })),
      assumptions: parsed.assumptions ?? [],
      qualityRisks: parsed.quality_risks ?? [],
      recommendations: (parsed.recommendations ?? []).map((r: Record<string, unknown>) => ({
        type: r.type,
        priority: r.priority,
        action: r.action,
      })),
      executiveSummary: parsed.executive_summary ?? "",
    };
  } catch {
    // Fall back to rule-based result
    return {
      questionId,
      answerability: coverageResult.answerability,
      confidence: coverageResult.confidence,
      knowns: coverageResult.knowns,
      unknowns: coverageResult.unknowns,
      assumptions: coverageResult.assumptions,
      qualityRisks: coverageResult.qualityRisks,
      recommendations: coverageResult.recommendations,
      executiveSummary: coverageResult.executiveSummary,
    };
  }
}

export async function chat(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  context: {
    datasets: string[];
    topInsights: string[];
    qualityScore: number;
    coverageSummary: string;
  }
): Promise<string> {
  if (isMockMode()) return mockChatResponse(userMessage);

  const contextBlock = `Available data context:
- Datasets: ${context.datasets.join(", ")}
- Data quality score: ${context.qualityScore}/100
- Coverage summary: ${context.coverageSummary}
- Top insights: ${context.topInsights.join("; ")}

Important rules:
- Always label responses with Known / Derived / Assumed / Unknown
- Never claim causation from descriptive data
- If a question cannot be answered, explain why and suggest what is needed`;

  const messages = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\n${contextBlock}` },
    ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  return callOpenAI(messages);
}

export async function generateExecutiveSummary(
  qualityScore: number,
  coverageResults: QuestionCoverageResult[],
  gaps: GapItem[]
): Promise<string> {
  const answerableCount = coverageResults.filter((r) => r.answerability === "direct").length;
  const partialCount = coverageResults.filter((r) => r.answerability === "partial").length;
  const totalQuestions = coverageResults.length;

  if (isMockMode()) {
    return mockExecutiveSummary(qualityScore, answerableCount, totalQuestions, gaps);
  }

  const prompt = `Generate a concise executive summary (2-3 paragraphs) for a people analytics readiness assessment.

Data quality score: ${qualityScore}/100
Questions directly answerable: ${answerableCount}/${totalQuestions}
Questions partially answerable: ${partialCount}/${totalQuestions}
Top gaps: ${gaps
    .slice(0, 5)
    .map((g) => `${g.title} (${g.severity})`)
    .join("; ")}

Format: Plain text. Lead with the answer. Be honest about limitations. End with 2-3 concrete recommended next steps.`;

  return callOpenAI([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ]);
}
