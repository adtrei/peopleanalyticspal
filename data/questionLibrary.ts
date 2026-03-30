import type { BusinessQuestion } from "@/types";

export const QUESTION_LIBRARY: BusinessQuestion[] = [
  // ─── Headcount ──────────────────────────────────────────────────────────
  {
    questionId: "headcount_monthly_active",
    questionText: "What is monthly active headcount?",
    category: "headcount",
    requiredConcepts: [
      { name: "Employee ID", canonicalField: "employee_id", required: true },
      { name: "Snapshot Month", canonicalField: "snapshot_month", required: true },
      { name: "Employment Status", canonicalField: "status", required: true },
    ],
    optionalConcepts: [
      { name: "Organization", canonicalField: "organization", required: false },
      { name: "Department", canonicalField: "department", required: false },
      { name: "Job", canonicalField: "job", required: false },
    ],
  },
  {
    questionId: "headcount_growth_shrinkage",
    questionText: "Where is headcount growing or shrinking?",
    category: "headcount",
    requiredConcepts: [
      { name: "Employee ID", canonicalField: "employee_id", required: true },
      { name: "Snapshot Month", canonicalField: "snapshot_month", required: true },
      { name: "Organization", canonicalField: "organization", required: true },
    ],
    optionalConcepts: [
      { name: "Department", canonicalField: "department", required: false },
      { name: "Business Line", canonicalField: "business_line", required: false },
    ],
  },
  {
    questionId: "headcount_anomalies",
    questionText: "Are we seeing unusual headcount spikes or drops?",
    category: "headcount",
    requiredConcepts: [
      { name: "Employee ID", canonicalField: "employee_id", required: true },
      { name: "Snapshot Month", canonicalField: "snapshot_month", required: true },
    ],
    optionalConcepts: [],
  },
  // ─── Attrition ──────────────────────────────────────────────────────────
  {
    questionId: "attrition_volume_trend",
    questionText: "What are hires, terms, and transfers over time?",
    category: "attrition",
    requiredConcepts: [
      { name: "Employee ID", canonicalField: "employee_id", required: true },
      { name: "Event Type", canonicalField: "event_type", required: true },
      { name: "Event Date", canonicalField: "event_date", required: true },
    ],
    optionalConcepts: [
      { name: "Organization", canonicalField: "organization", required: false },
    ],
  },
  {
    questionId: "attrition_top_reasons",
    questionText: "What are the top termination reasons?",
    category: "attrition",
    requiredConcepts: [
      { name: "Event Type", canonicalField: "event_type", required: true },
      { name: "Reason", canonicalField: "reason", required: true },
      { name: "Event Date", canonicalField: "event_date", required: true },
    ],
    optionalConcepts: [
      { name: "Organization", canonicalField: "organization", required: false },
      { name: "Reason Code", canonicalField: "reason_code", required: false },
    ],
  },
  {
    questionId: "attrition_why_people_leave",
    questionText: "Can we reliably explain why people are leaving?",
    category: "attrition",
    requiredConcepts: [
      { name: "Event Type", canonicalField: "event_type", required: true },
      { name: "Reason", canonicalField: "reason", required: true },
      { name: "Voluntary/Involuntary", canonicalField: "voluntary_flag", required: true },
      { name: "Manager Context", canonicalField: "supervisor", required: true },
      { name: "Tenure", canonicalField: "tenure_months", required: true },
      { name: "Performance Context", canonicalField: "performance_rating", required: true },
      { name: "Exit Sentiment", canonicalField: "exit_sentiment", required: true },
    ],
    optionalConcepts: [
      { name: "Compensation Context", canonicalField: "annual_salary", required: false },
      { name: "Engagement Score", canonicalField: "engagement_score", required: false },
    ],
  },
  {
    questionId: "attrition_voluntary_involuntary",
    questionText: "What share of attrition is voluntary vs involuntary?",
    category: "attrition",
    requiredConcepts: [
      { name: "Event Type", canonicalField: "event_type", required: true },
      { name: "Reason", canonicalField: "reason", required: true },
      { name: "Voluntary/Involuntary", canonicalField: "voluntary_flag", required: true },
    ],
    optionalConcepts: [
      { name: "Reason Code", canonicalField: "reason_code", required: false },
    ],
  },
  {
    questionId: "attrition_early_tenure",
    questionText: "What is early-tenure attrition (< 12 months)?",
    category: "attrition",
    requiredConcepts: [
      { name: "Event Type", canonicalField: "event_type", required: true },
      { name: "Date of Last Hire", canonicalField: "date_of_last_hire", required: true },
      { name: "Event Date", canonicalField: "event_date", required: true },
    ],
    optionalConcepts: [
      { name: "Organization", canonicalField: "organization", required: false },
      { name: "Job", canonicalField: "job", required: false },
    ],
  },
  // ─── Mobility ───────────────────────────────────────────────────────────
  {
    questionId: "mobility_transfer_volumes",
    questionText: "What is the internal transfer volume and pattern over time?",
    category: "mobility",
    requiredConcepts: [
      { name: "Event Type", canonicalField: "event_type", required: true },
      { name: "Event Date", canonicalField: "event_date", required: true },
    ],
    optionalConcepts: [
      { name: "Organization", canonicalField: "organization", required: false },
    ],
  },
  {
    questionId: "mobility_net_staffing",
    questionText: "Where are we relying on transfers vs external net hiring?",
    category: "mobility",
    requiredConcepts: [
      { name: "Event Type", canonicalField: "event_type", required: true },
      { name: "Event Date", canonicalField: "event_date", required: true },
      { name: "Organization", canonicalField: "organization", required: true },
    ],
    optionalConcepts: [],
  },
  // ─── Staffing ───────────────────────────────────────────────────────────
  {
    questionId: "staffing_volatility",
    questionText: "Which business lines have the highest workforce volatility?",
    category: "staffing",
    requiredConcepts: [
      { name: "Event Type", canonicalField: "event_type", required: true },
      { name: "Event Date", canonicalField: "event_date", required: true },
      { name: "Business Line", canonicalField: "business_line", required: true },
    ],
    optionalConcepts: [],
  },
  {
    questionId: "staffing_capability_gaps",
    questionText: "Where do we have insufficient measurement to support workforce decisions?",
    category: "staffing",
    requiredConcepts: [],
    optionalConcepts: [],
  },
  // ─── Governance ─────────────────────────────────────────────────────────
  {
    questionId: "governance_unanswerable",
    questionText: "Which questions are not answerable with the current dataset?",
    category: "governance",
    requiredConcepts: [],
    optionalConcepts: [],
  },
  {
    questionId: "governance_missing_fields",
    questionText: "Which missing fields would most improve answerability?",
    category: "governance",
    requiredConcepts: [],
    optionalConcepts: [],
  },
  {
    questionId: "governance_process_gaps",
    questionText: "What additional fields or process changes would most improve decision quality?",
    category: "governance",
    requiredConcepts: [],
    optionalConcepts: [],
  },
];
