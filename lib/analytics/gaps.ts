/**
 * Gap detection engine.
 * Produces a structured gap register from quality scores and coverage results.
 */
import type {
  GapItem,
  QuestionCoverageResult,
  DataQualityScore,
  ColumnProfile,
} from "@/types";
import { v4 as uuidv4 } from "uuid";

const MISSING_CRITICAL_FIELDS: Array<{
  field: string;
  label: string;
  whyItMatters: string;
  affectedQuestions: string[];
  recommendedAction: string;
  likelyOwner: string;
}> = [
  {
    field: "exit_sentiment",
    label: "Exit Sentiment / Exit Interview Data",
    whyItMatters:
      "Without exit feedback, termination reasons are limited to coded fields that often lack root-cause depth.",
    affectedQuestions: ["attrition_why_people_leave"],
    recommendedAction:
      "Implement a structured exit survey and capture responses in the HR system.",
    likelyOwner: "HR Operations / Talent",
  },
  {
    field: "regrettable_flag",
    label: "Regrettable Attrition Flag",
    whyItMatters:
      "All attrition looks equal without this flag. Leaders cannot distinguish performance-managed exits from high-value departures.",
    affectedQuestions: ["attrition_why_people_leave", "attrition_top_reasons"],
    recommendedAction:
      "Add a binary regrettable/non-regrettable capture step in the termination workflow.",
    likelyOwner: "HR Business Partner",
  },
  {
    field: "voluntary_flag",
    label: "Standardized Voluntary / Involuntary Classification",
    whyItMatters:
      "Voluntary and involuntary attrition require different responses. Without a clean flag, both count the same.",
    affectedQuestions: ["attrition_voluntary_involuntary", "attrition_why_people_leave"],
    recommendedAction:
      "Standardize the reason code taxonomy to map cleanly to voluntary/involuntary buckets.",
    likelyOwner: "HRIS / HR Ops",
  },
  {
    field: "performance_rating",
    label: "Performance Rating",
    whyItMatters:
      "Unable to distinguish top-performer departure from managed exits without performance context.",
    affectedQuestions: ["attrition_why_people_leave"],
    recommendedAction: "Link performance system to HR analytics exports.",
    likelyOwner: "Talent Management",
  },
  {
    field: "engagement_score",
    label: "Engagement / Pulse Survey Score",
    whyItMatters:
      "Engagement data is a leading indicator of attrition. Its absence means leaders cannot act before people leave.",
    affectedQuestions: ["attrition_why_people_leave", "governance_missing_fields"],
    recommendedAction:
      "Launch a regular pulse survey and connect results to the HR analytics layer.",
    likelyOwner: "HR Strategy / People Analytics",
  },
  {
    field: "demographic_fields",
    label: "Demographic Fields (Gender, Ethnicity, etc.)",
    whyItMatters:
      "Required for DEI analysis, adverse impact studies, and pay equity review.",
    affectedQuestions: ["governance_missing_fields"],
    recommendedAction:
      "Ensure voluntary self-identification fields are present and included in analytics exports with appropriate privacy controls.",
    likelyOwner: "HR Ops / Legal",
  },
];

export function buildGapRegister(
  coverageResults: QuestionCoverageResult[],
  qualityScore: DataQualityScore | undefined,
  profiles: ColumnProfile[]
): GapItem[] {
  const gaps: GapItem[] = [];

  // ─── Data gaps from coverage analysis ────────────────────────────────────
  const allUnknownConcepts = new Set(
    coverageResults.flatMap((r) => r.unknowns.map((u) => u.concept.toLowerCase()))
  );

  for (const missingField of MISSING_CRITICAL_FIELDS) {
    if (allUnknownConcepts.has(missingField.label.toLowerCase()) ||
        !profiles.some((p) => p.sourceColumnName.toLowerCase().includes(missingField.field.replace(/_/g, " ")))) {
      gaps.push({
        id: uuidv4(),
        gapType: "data",
        title: `Missing: ${missingField.label}`,
        description: `${missingField.label} is not present in the uploaded data.`,
        whyItMatters: missingField.whyItMatters,
        affectedQuestions: missingField.affectedQuestions,
        severity: "high",
        recommendedAction: missingField.recommendedAction,
        likelyOwner: missingField.likelyOwner,
        estimatedEffort: "high",
      });
    }
  }

  // ─── Quality gaps from quality checks ────────────────────────────────────
  if (qualityScore) {
    for (const check of qualityScore.checks) {
      if (check.status === "fail" || (check.status === "warn" && check.severity === "high")) {
        gaps.push({
          id: uuidv4(),
          gapType: "quality",
          title: `Quality: ${check.rule}`,
          description: check.evidence,
          whyItMatters: "Data quality issues reduce the reliability of analytics and can lead to incorrect conclusions.",
          affectedQuestions: [],
          severity: check.severity,
          recommendedAction: `Review and fix: ${check.rule}`,
          likelyOwner: "HRIS / HR Ops",
          estimatedEffort: "medium",
        });
      }
    }
  }

  // ─── Process gaps ─────────────────────────────────────────────────────────
  const hasTransferNormalizationIssue = qualityScore?.checks.some(
    (c) => c.evidence.includes("transfer") && c.status === "warn"
  );
  if (hasTransferNormalizationIssue) {
    gaps.push({
      id: uuidv4(),
      gapType: "process",
      title: "Process: Transfer events mixed into attrition counts",
      description:
        "Internal transfers appear in the same event feed as hires and terminations, inflating both counts.",
      whyItMatters:
        "Without separating transfers, reported attrition and hire rates are overstated, leading to incorrect workforce planning conclusions.",
      affectedQuestions: ["attrition_volume_trend", "attrition_top_reasons"],
      severity: "high",
      recommendedAction:
        "Ensure the data pipeline explicitly separates transfer events from external hires and terminations before reporting.",
      likelyOwner: "HRIS / People Analytics",
      estimatedEffort: "low",
    });
  }

  // Exit reason process gap
  const reasonProfile = profiles.find((p) => p.detectedRole === "reason");
  if (reasonProfile && (reasonProfile.topValues ?? []).some((v) => v.value.toLowerCase() === "other" && v.pct > 0.1)) {
    gaps.push({
      id: uuidv4(),
      gapType: "process",
      title: "Process: High rate of 'Other' exit reasons",
      description:
        "A significant portion of terminations are coded as 'Other', reducing the utility of reason-based analysis.",
      whyItMatters:
        "Coarse or vague reason codes prevent leaders from understanding actual departure drivers.",
      affectedQuestions: ["attrition_top_reasons", "attrition_why_people_leave"],
      severity: "medium",
      recommendedAction:
        "Require structured reason selection at termination entry — reduce 'Other' by adding granular sub-codes.",
      likelyOwner: "HR Business Partner / HRIS",
      estimatedEffort: "medium",
    });
  }

  // ─── Capability gaps ──────────────────────────────────────────────────────
  const unanswerable = coverageResults.filter((r) => r.answerability === "not_answerable");
  if (unanswerable.length > 2) {
    gaps.push({
      id: uuidv4(),
      gapType: "capability",
      title: "Capability: Multiple key questions unanswerable",
      description: `${unanswerable.length} business questions cannot be answered with current data.`,
      whyItMatters:
        "Leadership cannot make evidence-based workforce decisions without the ability to answer foundational analytics questions.",
      affectedQuestions: unanswerable.map((r) => r.questionId),
      severity: "high",
      recommendedAction:
        "Prioritize a data strategy roadmap. Start with the highest-impact missing fields and process fixes.",
      likelyOwner: "Chief People Officer / People Analytics Lead",
      estimatedEffort: "high",
    });
  }

  return gaps;
}
