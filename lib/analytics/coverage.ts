/**
 * Question coverage / answerability engine.
 * Evaluates each business question against available canonical field mappings.
 */
import type {
  BusinessQuestion,
  CanonicalFieldMap,
  ColumnProfile,
  QuestionCoverageResult,
  CellState,
  CoverageCell,
  KnownFact,
  UnknownFact,
  Answerability,
} from "@/types";
import { QUESTION_LIBRARY } from "@/data/questionLibrary";

function getFieldState(
  canonicalField: string,
  mappings: CanonicalFieldMap[],
  profiles: ColumnProfile[]
): { state: CellState; confidence: number } {
  const mapping = mappings.find((m) => m.canonicalFieldName === canonicalField);
  if (!mapping || mapping.canonicalFieldName === "unknown") {
    return { state: "missing", confidence: 0 };
  }

  const profile = profiles.find((p) => p.sourceColumnName === mapping.sourceColumnName);
  if (!profile) return { state: "missing", confidence: 0 };

  const baseConfidence = mapping.mappingConfidence;

  if (profile.nullRate > 0.5) return { state: "low_confidence", confidence: baseConfidence * 0.4 };
  if (profile.nullRate > 0.2) return { state: "partial", confidence: baseConfidence * 0.7 };
  if (baseConfidence < 0.5) return { state: "partial", confidence: baseConfidence };
  if (baseConfidence < 0.75) return { state: "derived", confidence: baseConfidence };

  return { state: "available", confidence: baseConfidence };
}

// Concepts that are derivable from other data
const DERIVABLE_FROM: Record<string, string[]> = {
  tenure_months: ["date_of_last_hire", "event_date"],
  voluntary_flag: ["reason", "reason_code"],
  snapshot_month: ["year_month"],
};

// Concepts that are always missing (no common HR system captures them)
const ALWAYS_MISSING_CONCEPTS = new Set([
  "exit_sentiment",
  "exit_interview_data",
  "regrettable_flag",
  "engagement_score",
  "performance_rating",
  "promotion_history",
  "comp_progression",
  "demographic_fields",
]);

export function evaluateQuestion(
  question: BusinessQuestion,
  mappings: CanonicalFieldMap[],
  profiles: ColumnProfile[],
  datasetIds: string[]
): QuestionCoverageResult {
  const allRequired = question.requiredConcepts;
  const mappedCanonicals = new Set(mappings.map((m) => m.canonicalFieldName));

  const knowns: KnownFact[] = [];
  const unknowns: UnknownFact[] = [];
  const assumptions: string[] = [];
  const qualityRisks: string[] = [];
  const cells: CoverageCell[] = [];

  let totalWeight = 0;
  let coveredWeight = 0;

  for (const concept of allRequired) {
    const { state, confidence } = getFieldState(concept.canonicalField, mappings, profiles);
    const weight = concept.required ? 2 : 1;
    totalWeight += weight;

    cells.push({
      questionId: question.questionId,
      conceptName: concept.name,
      state,
      epistemicStatus:
        state === "available" ? "known" :
        state === "derived" ? "derived" :
        state === "partial" ? "assumed" : "unknown",
    });

    if (state === "missing" || state === "low_confidence") {
      // Check if derivable
      const derivableDeps = DERIVABLE_FROM[concept.canonicalField];
      if (derivableDeps && derivableDeps.every((dep) => mappedCanonicals.has(dep))) {
        unknowns.push({
          concept: concept.name,
          status: "unknown",
          whyMissing: `Not directly present but can be derived from ${derivableDeps.join(", ")}`,
        });
        assumptions.push(`${concept.name} derived from available fields via rule-based logic`);
        coveredWeight += weight * 0.6;
      } else if (ALWAYS_MISSING_CONCEPTS.has(concept.canonicalField)) {
        unknowns.push({
          concept: concept.name,
          status: "unknown",
          whyMissing: "Not captured in current HR system exports — requires additional data collection",
        });
      } else {
        unknowns.push({
          concept: concept.name,
          status: "unknown",
          whyMissing: "Field not found in uploaded data",
        });
      }
    } else {
      const mapping = mappings.find((m) => m.canonicalFieldName === concept.canonicalField);
      knowns.push({
        concept: concept.name,
        status: state === "derived" ? "derived" : state === "partial" ? "assumed" : "known",
        evidenceFields: mapping ? [mapping.sourceColumnName] : [],
        qualityNotes: state === "partial" ? ["High null rate reduces reliability"] : [],
      });
      coveredWeight += weight * confidence;
    }
  }

  if (totalWeight === 0) {
    // Governance questions have no required concepts
    return {
      questionId: question.questionId,
      questionText: question.questionText,
      datasetScope: datasetIds,
      answerability: "partial",
      knowns: [],
      unknowns: [],
      assumptions: [],
      qualityRisks: [],
      confidence: 0.5,
      recommendations: [],
      executiveSummary:
        "This question requires a meta-analysis of the available data and gap assessment.",
    };
  }

  const coverageRatio = coveredWeight / (totalWeight * 1.0);
  const confidence = Math.min(coverageRatio, 0.99);

  let answerability: Answerability;
  if (confidence >= 0.8) answerability = "direct";
  else if (confidence >= 0.4) answerability = "partial";
  else answerability = "not_answerable";

  // Quality risks
  const transferMapping = mappings.find((m) => m.canonicalFieldName === "event_type");
  if (transferMapping && question.category === "attrition") {
    qualityRisks.push("Internal transfers must be excluded from attrition calculations to avoid double-counting");
  }

  const recommendations = [];
  for (const u of unknowns) {
    if (ALWAYS_MISSING_CONCEPTS.has(u.concept.toLowerCase().replace(/\s/g, "_"))) {
      recommendations.push({
        type: "data" as const,
        priority: "high" as const,
        action: `Add "${u.concept}" to HR data collection process`,
        estimatedEffort: "high" as const,
      });
    } else {
      recommendations.push({
        type: "process" as const,
        priority: "medium" as const,
        action: `Ensure "${u.concept}" is captured in source system and included in exports`,
        estimatedEffort: "medium" as const,
      });
    }
  }

  const executiveSummary = answerability === "direct"
    ? `The dataset provides sufficient data to answer this question directly.`
    : answerability === "partial"
    ? `This question can be partially answered. ${unknowns.length} required concept(s) are missing or incomplete.`
    : `This question cannot be reliably answered with the current data. ${unknowns.length} required concept(s) are absent.`;

  return {
    questionId: question.questionId,
    questionText: question.questionText,
    datasetScope: datasetIds,
    answerability,
    knowns,
    unknowns,
    assumptions,
    qualityRisks,
    confidence,
    recommendations,
    executiveSummary,
  };
}

export function evaluateAllQuestions(
  mappings: CanonicalFieldMap[],
  profiles: ColumnProfile[],
  datasetIds: string[]
): QuestionCoverageResult[] {
  return QUESTION_LIBRARY.map((q) => evaluateQuestion(q, mappings, profiles, datasetIds));
}

export function buildCoverageCells(
  results: QuestionCoverageResult[]
): CoverageCell[] {
  return results.flatMap((r) =>
    [...r.knowns.map((k) => ({
      questionId: r.questionId,
      conceptName: k.concept,
      state: "available" as CellState,
      epistemicStatus: k.status,
    })),
    ...r.unknowns.map((u) => ({
      questionId: r.questionId,
      conceptName: u.concept,
      state: "missing" as CellState,
      epistemicStatus: u.status,
    }))]
  );
}
