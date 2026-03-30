// ─── Epistemic Status ──────────────────────────────────────────────────────
export type EpistemicStatus = "known" | "derived" | "assumed" | "unknown" | "contested";

export type Answerability = "direct" | "partial" | "not_answerable";

export type GapType = "data" | "quality" | "process" | "capability";

export type Severity = "critical" | "high" | "medium" | "low";

export type Effort = "low" | "medium" | "high";

// ─── Dataset ───────────────────────────────────────────────────────────────
export type DatasetSourceType =
  | "hcm_snapshot"
  | "workforce_event"
  | "ats_event"
  | "survey"
  | "schema_manifest";

export interface Dataset {
  id: string;
  name: string;
  sourceType: DatasetSourceType;
  uploadedAt: string;
  rowCount: number;
  columnCount: number;
  fileSizeBytes: number;
  columns: string[];
  // FUTURE: Supabase storage ref when persistence is added
}

// ─── Column Profile ────────────────────────────────────────────────────────
export type InferredType =
  | "string"
  | "number"
  | "date"
  | "boolean"
  | "identifier"
  | "categorical"
  | "currency";

export type DetectedRole =
  | "employee_id"
  | "date"
  | "org"
  | "department"
  | "job"
  | "status"
  | "reason"
  | "salary"
  | "manager"
  | "location"
  | "name"
  | "event_type"
  | "year_month"
  | "unknown";

export interface ColumnProfile {
  datasetId: string;
  sourceColumnName: string;
  inferredType: InferredType;
  nullRate: number;
  uniqueCount: number;
  totalCount: number;
  sampleValues: string[];
  detectedRole: DetectedRole;
  warnings: string[];
  dateParseSuccess?: number; // fraction 0-1 if date type
  topValues?: Array<{ value: string; count: number; pct: number }>;
}

// ─── Canonical Field Map ───────────────────────────────────────────────────
export interface CanonicalFieldMap {
  datasetId: string;
  sourceColumnName: string;
  canonicalFieldName: string;
  mappingConfidence: number; // 0–1
  approvedByUser: boolean;
  transformationLogic?: string;
}

export interface CanonicalField {
  name: string;
  label: string;
  description: string;
  expectedTypes: InferredType[];
  detectedRole: DetectedRole;
  required: boolean;
  category: string;
}

// ─── Workforce Fact Models ─────────────────────────────────────────────────
export interface HeadcountRow {
  employeeId: string;
  snapshotMonth: string; // "YYYY-MM"
  firstName?: string;
  lastName?: string;
  status?: string;
  company?: string;
  companyCode?: string;
  organization?: string;
  department?: string;
  businessLine?: string;
  project?: string;
  locationCode?: string;
  jobCode?: string;
  job?: string;
  flsaType?: string;
  ftOrPt?: string;
  localUnion?: string;
  employeeType?: string;
  supervisor?: string;
  dateOfSeniority?: string;
  dateOfLastHire?: string;
  dateOfOriginalHire?: string;
}

export type WorkforceEventType =
  | "hire"
  | "termination"
  | "transfer_in"
  | "transfer_out"
  | "rehire"
  | "other";

export interface WorkforceEventRow {
  employeeId: string;
  eventDate: string;
  eventMonth: string; // "YYYY-MM"
  eventType: WorkforceEventType;
  reasonCode?: string;
  reason?: string;
  company?: string;
  companyCode?: string;
  organization?: string;
  department?: string;
  businessLine?: string;
  jobCode?: string;
  job?: string;
  employeeType?: string;
  annualSalary?: number;
  employeeName?: string;
}

// ─── Business Questions ────────────────────────────────────────────────────
export type QuestionCategory =
  | "headcount"
  | "attrition"
  | "mobility"
  | "staffing"
  | "governance";

export interface RequiredConcept {
  name: string;
  canonicalField: string;
  required: boolean;
}

export interface BusinessQuestion {
  questionId: string;
  questionText: string;
  category: QuestionCategory;
  requiredConcepts: RequiredConcept[];
  optionalConcepts: RequiredConcept[];
}

// ─── Coverage / Answerability ──────────────────────────────────────────────
export type CellState = "available" | "derived" | "partial" | "missing" | "low_confidence";

export interface CoverageCell {
  questionId: string;
  conceptName: string;
  state: CellState;
  epistemicStatus: EpistemicStatus;
  notes?: string;
}

export interface KnownFact {
  concept: string;
  status: EpistemicStatus;
  evidenceFields: string[];
  qualityNotes: string[];
}

export interface UnknownFact {
  concept: string;
  status: "unknown" | "contested";
  whyMissing: string;
}

export interface Recommendation {
  type: GapType;
  priority: Severity;
  action: string;
  estimatedEffort?: Effort;
}

export interface QuestionCoverageResult {
  questionId: string;
  questionText: string;
  datasetScope: string[];
  answerability: Answerability;
  knowns: KnownFact[];
  unknowns: UnknownFact[];
  assumptions: string[];
  qualityRisks: string[];
  confidence: number; // 0–1
  recommendations: Recommendation[];
  executiveSummary: string;
}

// ─── Data Quality ──────────────────────────────────────────────────────────
export type QualityDimension =
  | "schema"
  | "missingness"
  | "uniqueness"
  | "volume"
  | "freshness"
  | "integrity"
  | "distribution";

export interface DataQualityCheck {
  entity: string;
  dimension: QualityDimension;
  rule: string;
  status: "pass" | "warn" | "fail";
  severity: Severity;
  evidence: string;
  affectedColumns?: string[];
}

export interface DataQualityScore {
  overall: number; // 0–100
  dimensions: Record<QualityDimension, number>;
  checks: DataQualityCheck[];
  safeFor: string[]; // e.g. "trending", "executive reporting"
  criticalWarnings: string[];
}

// ─── Gap Register ──────────────────────────────────────────────────────────
export interface GapItem {
  id: string;
  gapType: GapType;
  title: string;
  description: string;
  whyItMatters: string;
  affectedQuestions: string[];
  severity: Severity;
  recommendedAction: string;
  likelyOwner: string;
  estimatedEffort: Effort;
}

// ─── Narrative Insight ─────────────────────────────────────────────────────
export type InsightType = "descriptive" | "predictive" | "causal_hypothesis";

export interface NarrativeInsight {
  id: string;
  title: string;
  insightType: InsightType;
  claim: string;
  evidence: string;
  limitations: string;
  confidence: number;
  epistemicStatus: EpistemicStatus;
  chartRef?: string;
}

// ─── Project / Session ─────────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  createdAt: string;
  datasets: Dataset[];
  columnProfiles: ColumnProfile[];
  fieldMappings: CanonicalFieldMap[];
  qualityScores: Record<string, DataQualityScore>;
  coverageResults: QuestionCoverageResult[];
  gaps: GapItem[];
}

// ─── AI Analysis Output ────────────────────────────────────────────────────
export interface AIAnalysisOutput {
  questionId: string;
  answerability: Answerability;
  confidence: number;
  knowns: KnownFact[];
  unknowns: UnknownFact[];
  assumptions: string[];
  qualityRisks: string[];
  recommendations: Recommendation[];
  executiveSummary: string;
}

// ─── Chat ──────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  epistemicAnnotations?: {
    knowns: string[];
    unknowns: string[];
    assumptions: string[];
  };
}

// ─── Analytics ────────────────────────────────────────────────────────────
export interface MonthlyHeadcount {
  month: string; // "YYYY-MM"
  count: number;
  byOrg?: Record<string, number>;
  byDept?: Record<string, number>;
  byJob?: Record<string, number>;
}

export interface MonthlyEvent {
  month: string;
  hires: number;
  terminations: number;
  transfersIn: number;
  transfersOut: number;
  netExternal: number;
}

export interface TerminationReasonSummary {
  reason: string;
  count: number;
  pct: number;
  inferredVoluntary?: "voluntary" | "involuntary" | "unknown";
}

export interface TenureBucket {
  label: string;
  minMonths: number;
  maxMonths: number;
  count: number;
  pct: number;
}
