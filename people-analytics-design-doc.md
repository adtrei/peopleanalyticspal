
# Smart People Analytics Assistant
## First-Pass Coding Design Document

### Purpose
Design a first-pass application that ingests HR system exports and/or schema-only field inventories, then clearly distinguishes:
1. what the organization **knows** from current data,
2. what it can only **partially infer**,
3. what it **does not know** because the information is missing, unreliable, unstandardized, or procedurally uncaptured.

The product goal is not just reporting. It is to create an executive-friendly **gap intelligence layer** for people analytics, especially for headcount trend analysis, attrition analysis, staffing decisions, and HR process redesign.

---

## 1) Executive summary

The proposed product is a **smart people analytics assistant** built as a web application that can:
- upload CSVs or schema manifests from HCM / ATS / survey / related HR sources,
- profile the data automatically,
- map source columns into a canonical workforce schema,
- score data quality and question-answerability,
- flag what is known vs unknown for key people analytics questions,
- generate clear narrative summaries and executive-ready visualizations,
- optionally call OpenAI for structured analysis and narrative generation,
- grow later into a Supabase-backed warehouse and governed analytics platform.

The MVP should **not** begin with predictive attrition risk scoring. It should begin with:
- data profiling,
- schema mapping,
- gap detection,
- descriptive workforce analytics,
- observability,
- explainable narrative generation.

That gets to credibility fastest.

---

## 2) What the uploaded sample data supports right now

### Source inventory analyzed
I reviewed 4 CSVs:
- `Related Headcount Snapshot Mar 2024-Feb 2025.csv`
- `Related Headcount Snapshot Mar 2025-Feb 2026.csv`
- `Related Hires and Terms Mar 2024-Feb 2025.csv`
- `Related Hires and Terms Mar 2025-Feb 2026.csv`

### Observed structure
**Headcount snapshots**
- 2 files
- 29 columns each
- 113,437 total rows
- 6,865 unique employees
- 25 unique monthly snapshots total
- 1 overlapping month (`2025-02`) which is identical across both headcount files and must be deduplicated at ingest

Representative fields:
- employee id / name
- employment status
- seniority / hire dates
- company
- org / department / business line hierarchy
- project
- location
- job code / job title
- FLSA / FT-PT / union
- supervisor

Notable missingness in headcount snapshots:
- `LocalUnion`: ~71.4% null
- `Project`: ~36.6% null
- most org hierarchy fields are otherwise very complete

**Hire / termination events**
- 2 files
- 23 columns each
- 8,338 total rows
- 5,016 unique employees
- 24 unique event months

Representative fields:
- event type (`Hire`, `Termination`)
- effective date
- reason code / reason
- org / department / business line hierarchy
- job code / job title
- employee type
- annual salary

Notable findings:
- employee-id overlap between event tables and headcount snapshots is about **97.3%** of unique event employees
- termination reasons are usually present, but not all reasons are decision-grade root-cause data
- internal movement is mixed into event data via `Transferred in` / `Transferred out`
- there are large transfer spikes in December periods, so the app must separate **internal mobility** from true net staffing gain/loss

### What can be answered well enough now
The current sample appears good enough for:
- monthly active headcount trends
- headcount by org / department / business line / job / company
- hire and termination volumes over time
- internal transfer volumes over time
- termination reason distributions
- salary-at-event summaries
- employee type mix
- tenure calculations (derivable from hire dates and event dates)
- month-over-month anomaly detection

### What can be answered only partially
- voluntary vs involuntary attrition (derivable from reason mapping, but not cleanly standardized)
- manager-level attrition (possible if terms are joined to nearest prior snapshot to infer supervisor-at-exit)
- regrettable vs non-regrettable attrition (not explicitly present)
- “why are people leaving?” beyond coarse event reasons
- early tenure failure patterns (possible, but incomplete without richer context)

### What cannot be answered reliably from the current sample alone
- sentiment at exit
- engagement / burnout / morale
- performance context
- promotion history
- compensation progression vs market
- manager quality / team climate
- recruiting funnel quality, source quality, time-to-fill, offer acceptance dynamics
- DEI / adverse impact analyses (no demographic fields shown in the sample)
- causal claims about what *drives* attrition

---

## 3) Product thesis

This should be built as a **people analytics observability and decision-support application**, not as “just another dashboard.”

The key output is a trust-aware answer to questions like:
- Can we answer this business question with current data?
- If not, why not?
- Is the problem missing data, bad process, poor adoption, weak schema design, or lack of ownership?
- What is the lowest-cost next change that would improve answerability?

---

## 4) Product goals

### Primary goals
1. **Ingest reality quickly**
   - Accept raw CSVs, exports, or schema-only manifests
   - Work even before a full warehouse exists

2. **Create a canonical workforce data model**
   - Normalize field names across HCM / ATS / survey / event sources
   - Track lineage and confidence

3. **Measure what is known vs unknown**
   - Show direct observations, derivations, assumptions, and absences separately

4. **Support executive storytelling**
   - Produce one-page summaries that are honest, visual, and decision-oriented

5. **Preserve credibility**
   - Never overstate what the data proves
   - Explicitly distinguish descriptive insight, predictive signal, and causal hypothesis

### Non-goals for v1
- no autonomous employment decisions
- no black-box attrition “risk score” presented as truth
- no email sentiment mining in the MVP
- no fully automated causal claims
- no giant enterprise integration layer in the first pass

---

## 5) Core users

### 1. People analytics / HR strategy lead
Needs fast synthesis, gap analysis, and leadership narrative.

### 2. HRIS / ops analyst
Needs schema mapping, quality checks, and repeatable ingest.

### 3. Executive / CHRO / COO / CFO
Needs a high-trust summary:
- what we know,
- what we do not know,
- what should change next.

### 4. HR business partner
Needs segment-level drilldowns without false certainty.

---

## 6) Core user stories

1. As an analyst, I can upload a headcount snapshot CSV and an events CSV and get a data profile in minutes.
2. As an analyst, I can upload only a field inventory and still get a “measurement gap” assessment.
3. As a leader, I can ask “Can we reliably explain attrition in this business line?” and get a structured answer.
4. As a leader, I can see which critical questions are:
   - answerable,
   - partially answerable,
   - not answerable.
5. As an analyst, I can see which missing data gaps are due to:
   - missing fields,
   - null-heavy fields,
   - inconsistent coding,
   - lack of process,
   - lack of source system coverage.
6. As an analyst, I can export a clean executive deck summary or memo-ready output.

---

## 7) Product principles

1. **Evidence first**
   - Every insight must point back to specific data fields, logic, and quality status.

2. **Known / derived / assumed / unknown must be visibly separate**
   - This is the defining design choice.

3. **Descriptive before predictive**
   - First earn trust by showing what exists and what is missing.

4. **Correlation is not causation**
   - Any driver analysis must be labeled carefully.

5. **Question-centered, not dataset-centered**
   - Users care about business questions, not tables.

6. **Executive-simple, analyst-deep**
   - The first screen must be clean, with drilldown available.

7. **Privacy-preserving by default**
   - Minimize direct exposure of names and employee identifiers.

---

## 8) Recommended MVP architecture

### Recommended stack
Use a **Next.js + TypeScript** application for the primary product shell.

Suggested stack:
- **Frontend:** Next.js (App Router), TypeScript, Tailwind, shadcn/ui
- **Charts:** Recharts or ECharts
- **Tables:** TanStack Table / AG Grid Community
- **CSV ingest/parsing:** Papaparse or server-side CSV parser
- **Analytical engine:** DuckDB for local and early-stage batch analysis
- **Validation / schema rules:** Zod + custom rules, with a GX-style validation layer
- **Auth (later):** Supabase Auth or equivalent
- **Persistence (later):** Supabase Postgres
- **File storage (later):** Supabase Storage or S3
- **AI integration:** OpenAI via server-side API routes
- **Observability:** app logs + metric events + validation reports

### Why this stack
- Fast to generate with Claude Code / Codex
- Easy to keep in GitHub
- Can be deployed quickly
- Preserves a path to a more serious data layer later
- Lets the MVP work from file uploads before full warehousing exists

### Architectural stance
Use a **modular monolith** first:
- one repository
- clear module boundaries
- avoid premature microservices

---

## 9) Suggested repository structure

```text
/apps/web
  /app
  /components
  /features
    /upload
    /profiling
    /mapping
    /questions
    /gap-analysis
    /storytelling
    /chat
  /lib
    /ai
    /analytics
    /schema
    /quality
    /db
    /exports
  /types
  /tests

/packages/core
  /canonical-schema
  /question-library
  /quality-rules
  /types

/packages/prompts
  /people-analytics-system-prompts
  /json-schemas

/docs
  /architecture
  /data-dictionary
  /decision-log
```

---

## 10) Canonical domain model

### Core entities
1. **Dataset**
   - id
   - name
   - source type (`hcm_snapshot`, `workforce_event`, `ats_event`, `survey`, `schema_manifest`)
   - upload timestamp
   - source system
   - owner
   - pii classification

2. **ColumnProfile**
   - dataset_id
   - source_column_name
   - inferred_type
   - null_rate
   - unique_count
   - sample_values
   - detected_role (id, date, org, status, reason, salary, manager, etc.)

3. **CanonicalFieldMap**
   - dataset_id
   - source_column_name
   - canonical_field_name
   - mapping_confidence
   - approved_by_user
   - transformation_logic

4. **FactHeadcountSnapshot**
   - employee_id
   - snapshot_month
   - employment_status
   - org_unit_id
   - department_id
   - business_line_id
   - company_id
   - job_id
   - location_id
   - supervisor_id_or_name
   - employment_type
   - flsa_type
   - union_status
   - project_id
   - hire_dates

5. **FactWorkforceEvent**
   - employee_id
   - event_date
   - event_month
   - event_type (`hire`, `termination`, `transfer_in`, `transfer_out`, `rehire`, `other`)
   - reason_code
   - reason_text
   - org snapshot at event
   - job snapshot at event
   - employee_type
   - annual_salary

6. **BusinessQuestion**
   - question_id
   - question_text
   - category (`headcount`, `attrition`, `mobility`, `staffing`, `quality`)
   - required_fields
   - optional_fields
   - recommended_fields
   - answerability_logic

7. **QuestionCoverageResult**
   - question_id
   - dataset_scope
   - answerability (`direct`, `partial`, `not_answerable`)
   - knowns
   - unknowns
   - assumptions
   - quality_risks
   - confidence
   - recommendations

8. **DataQualityCheck**
   - entity
   - dimension (`schema`, `missingness`, `uniqueness`, `volume`, `freshness`, `integrity`, `distribution`)
   - rule
   - status
   - severity
   - evidence

9. **NarrativeInsight**
   - title
   - insight_type (`descriptive`, `predictive`, `causal_hypothesis`)
   - claim
   - evidence
   - limitations
   - chart_ref
   - confidence

---

## 11) Canonical business question library

The app should ship with a starter library of critical questions.

### Headcount
- What is monthly active headcount?
- Where is headcount growing or shrinking?
- Which organizations drive net change?
- Are we seeing unusual spikes or drops?

### Attrition
- How many terminations occurred by month and org?
- What share appears voluntary vs involuntary?
- Which reasons are most common?
- What is early-tenure attrition?
- Can we identify likely regrettable loss?
- Where is attrition explainable vs opaque?

### Staffing / capability
- Which business lines have the highest volatility?
- Where are we relying on transfer activity rather than net new hiring?
- Where do we have insufficient measurement to support workforce decisions?

### Data governance
- Which questions are currently unanswerable?
- Which missing fields would most improve answerability?
- Which process gaps are likely causing data absence?

---

## 12) Question answerability framework

This is the core differentiator.

Each business question should be evaluated against:
1. **Field presence**
2. **Field completeness**
3. **Field consistency**
4. **Joinability across sources**
5. **Temporal coverage**
6. **Semantic adequacy**
7. **Need for human/process context**

### Example answerability states
- **Directly answerable**  
  Required fields exist, quality is acceptable, logic is simple.

- **Partially answerable**  
  Core fields exist, but important context is missing or low quality.

- **Not answerable**  
  Required concepts are absent, too sparse, or too ambiguous.

### Example: “Why are people leaving?”
- Available now:
  - termination event
  - reason
  - organization
  - salary at event
  - likely tenure derivation
- Missing:
  - exit sentiment
  - manager context
  - engagement history
  - performance history
  - regret status
  - standardized taxonomy for root cause
- Result:
  - **Partially answerable**

---

## 13) Known / unknown taxonomy

Every insight should use this exact taxonomy:

### Known
Directly observed in uploaded data.

### Derived
Computed with transparent logic from observed data.

### Assumed
Requires a business rule or classification choice.

### Unknown
Not collected, inaccessible, too sparse, or too unreliable.

### Contested
A field exists, but there is reason to doubt its validity or semantic meaning.

This taxonomy should appear in UI chips, narrative cards, exports, and AI responses.

---

## 14) Data profiling and quality engine

### Ingest rules
At upload, automatically compute:
- row count
- column count
- inferred types
- date parsing success
- null rates
- unique counts
- duplicate rate
- value frequency tables
- month coverage
- entity overlap across files
- schema drift vs previous upload

### Required quality dimensions
Use at minimum:
- schema conformity
- missingness / completeness
- uniqueness
- integrity / joinability
- volume anomalies
- freshness / temporal continuity
- distribution drift

### Example rules
- employee id must parse as string/integer and be non-null
- monthly headcount snapshots should not have duplicate employee + month keys
- event dates must be parseable
- reason values should map to a known reason taxonomy
- overlapping snapshot months should be deduplicated
- transferred-in / transferred-out events should not be treated as external net gain/loss by default

### Output
Each dataset gets:
- overall quality score
- dimension-level scores
- critical warnings
- “safe for” analysis tags (e.g. trending, segmentation, executive reporting, experimentation)

---

## 15) Gap detection engine

The gap engine should diagnose four classes of issues:

### A. Data gaps
Example:
- no sentiment field
- no exit interview text
- no performance rating

### B. Data quality gaps
Example:
- missing supervisor values
- inconsistent reason codes
- unparseable dates
- overlapping snapshot files

### C. Process gaps
Example:
- exit reasons captured but too coarse to answer leadership questions
- managers not required to provide structured root-cause detail
- no standard step to capture regrettable loss

### D. Organizational capability gaps
Example:
- no owner for workforce measurement
- no survey instrument
- no governance around canonical HR definitions

The system should generate:
- issue
- why it matters
- affected question(s)
- impact severity
- recommended next action
- likely owner
- effort estimate (low/medium/high)

---

## 16) Executive-facing application UX

### Primary screens

#### 1. Home / Executive Summary
A very clean overview with:
- active headcount trend
- hires / terms / transfers trend
- top known insights
- top unknowns blocking decision quality
- data trust score
- critical recommendations

#### 2. Data Coverage Matrix
Rows = business questions  
Columns = required concepts / fields / source coverage  
Cell states:
- available
- derived
- partial
- missing
- low confidence

#### 3. Gap Register
A sortable list of:
- missing data
- process gaps
- quality issues
- recommended fixes

#### 4. Headcount Explorer
Time series + drilldowns by org / department / company / role.

#### 5. Attrition Explorer
Reason mix, segment comparison, voluntary/involuntary mapping, tenure buckets, transfer normalization.

#### 6. AI Analyst Chat
Chat with the assistant, grounded in uploaded data and business-question schemas.

#### 7. Dataset / Schema Admin
Mapping screen, quality checks, upload history, schema decisions.

---

## 17) Executive storytelling patterns

The storytelling layer should follow a few rules:

1. **Lead with the answer, then the caveat**
   - “Attrition appears concentrated in X, but root-cause evidence is incomplete.”

2. **Always include a ‘what we know / what we don’t know’ section**
   - mandatory on every insight page

3. **Use one message per chart**
   - title the chart with the takeaway, not just the metric name

4. **Default to time trends and ranked comparisons**
   - line charts for trends
   - bars for category comparisons

5. **Avoid overloading the executive dashboard**
   - keep summary dashboards intentionally sparse

6. **Do not rely on color alone**
   - use icons, labels, and text states in addition to color

### Suggested chart set for MVP
- line chart: active headcount over time
- bar chart: top termination reasons
- stacked bar: hires / terms / transfers by month
- heatmap/table: question coverage matrix
- waterfall or variance chart: net headcount change drivers
- KPI cards: trust score, answerable questions %, highest-impact unknowns

---

## 18) AI assistant design

### Role of AI in v1
Use AI for:
- field interpretation
- schema mapping suggestions
- gap explanation
- narrative synthesis
- question answerability reasoning
- recommendation drafting
- executive summary generation

Do **not** use AI in v1 to:
- make employment decisions
- label people as high risk without heavy safeguards
- infer sensitive psychological states from weak evidence

### Recommended OpenAI usage
Use OpenAI server-side only.
The AI should return **structured JSON**, not free-form text first.
Then the app renders UI from structured outputs and optionally adds a narrative layer.

### Suggested AI workflow
1. Profile uploaded data
2. Build canonical field map
3. Select business question
4. Assemble evidence bundle
5. Send evidence + instructions to OpenAI
6. Get structured answerability output
7. Render:
   - knowns
   - unknowns
   - confidence
   - recommendations
   - narrative summary

### Suggested model tasks
- `schema_mapper`
- `question_coverage_analyst`
- `gap_diagnostician`
- `executive_storyliner`

### Example structured output schema
```json
{
  "question_id": "attrition_why_people_leave",
  "answerability": "partial",
  "confidence": 0.78,
  "knowns": [
    {
      "concept": "termination reason",
      "status": "known",
      "evidence_fields": ["Reason", "Reason Code"],
      "quality_notes": ["reason exists but may be coarse"]
    }
  ],
  "unknowns": [
    {
      "concept": "exit sentiment",
      "status": "unknown",
      "why_missing": "no survey, interview text, or sentiment field present"
    }
  ],
  "assumptions": [
    "voluntary/involuntary class inferred from reason mapping"
  ],
  "quality_risks": [
    "internal transfers appear in event tables and can distort true attrition"
  ],
  "recommendations": [
    {
      "type": "process",
      "priority": "high",
      "action": "capture standardized regrettable/non-regrettable flag at termination"
    },
    {
      "type": "data_collection",
      "priority": "high",
      "action": "add structured exit survey with reason, sentiment, manager, and work-environment fields"
    }
  ],
  "executive_summary": "The dataset supports basic attrition reporting but does not support a reliable explanation of why employees leave beyond coarse coded reasons."
}
```

---

## 19) System prompt for the OpenAI analyst

The application should include a strong internal system prompt similar to the following:

> You are a senior people analytics architect and workforce decision-support analyst.  
> Your job is to assess what can and cannot be responsibly concluded from uploaded workforce data.  
> You must separate direct observation, derivation, assumption, and absence.  
> Never imply causation from descriptive correlations.  
> Never invent fields that are not present.  
> If a business question cannot be answered, explain why in plain language and recommend the smallest set of new fields, process changes, or governance steps that would improve answerability.  
> Optimize for executive clarity, methodological honesty, and practical next actions.  
> Prefer concise, structured outputs.  
> The user values data that is reliable, accurate, transparent, and useful for staffing, attrition, and organizational decision-making.

---

## 20) Suggested question-to-field requirements

### Monthly headcount trend
Required:
- employee_id
- snapshot_month
- status

Optional:
- org / department / job / company / supervisor

### Attrition by reason
Required:
- employee_id
- event_type
- event_date
- reason

Optional:
- org
- job
- salary
- tenure

### Why are people leaving?
Required for strong answer:
- termination event
- standardized reason
- voluntary/involuntary
- org
- manager
- tenure
- role / job family
- location
- comp context
- performance context
- engagement or exit sentiment

The current sample does not fully satisfy this.

---

## 21) Explainability and causality design

The app should have three distinct analysis modes.

### Mode 1: Descriptive
What happened?
- headcount
- hires
- terms
- reason mix
- segment variation

### Mode 2: Predictive / risk
What patterns are associated with outcomes?
- allowed only after enough fields exist
- must use explainability overlays
- must clearly say “associated with,” not “caused by”

### Mode 3: Causal hypothesis
What interventions might change outcomes?
- disabled by default
- requires explicit assumptions
- requires causal graph or formal causal design
- should be labeled as experimental / advanced

### Explainability features
If predictive models are added later:
- global feature importance
- local explanations
- segment stability analysis
- model cards
- fairness checks
- threshold calibration notes

---

## 22) Observability and monitoring requirements

The app should not only analyze workforce data; it should observe the quality of the data pipeline itself.

### Required monitors
- schema drift
- missingness drift
- reason-value drift
- month coverage gaps
- duplicate explosion
- join-rate changes
- anomalous spikes in transfers / terms / hires
- stale datasets

### Suggested output
“Data trust” panel:
- freshness
- completeness
- integrity
- semantic adequacy
- executive-reporting readiness

---

## 23) Privacy, security, and governance

Because this is HR data, the product should begin with conservative controls.

### MVP safeguards
- server-side API calls only
- never expose API keys in client code
- mask or hash employee identifiers in analytical layers where possible
- role-based access paths later
- audit log for uploads and AI analysis actions
- dataset retention controls
- PII toggle for views
- export warnings when names are present

### Policy stance
The application should be framed as a **decision-support tool**, not an automated employment decision engine.

---

## 24) Delivery roadmap

### Phase 1 — MVP
- file upload
- data profiling
- schema mapping
- question library
- answerability engine
- quality scoring
- executive summary
- AI narrative generation

### Phase 2 — Better intelligence
- saved projects
- canonical field mappings across uploads
- richer gap recommendations
- snapshot/event joins
- supervisor-at-exit derivation
- export to memo / deck format

### Phase 3 — Warehouse and governance
- Supabase Postgres
- persistent audit trail
- user auth
- row-level security
- reusable semantic layer
- scheduled refreshes

### Phase 4 — Advanced analytics
- attrition segmentation
- predictive models with explainability
- causal experimentation workspace
- survey integration
- ATS integration
- manager hierarchy analytics

---

## 25) Acceptance criteria for the generated application

The first generated build should be considered successful if it can:
1. upload at least two CSVs,
2. infer column types and profile them,
3. allow manual correction of field mappings,
4. show a coverage matrix for a starter question library,
5. distinguish known / derived / assumed / unknown,
6. generate a clean executive summary,
7. flag quality issues and likely process gaps,
8. correctly normalize transfer events away from true attrition by default,
9. run locally from a GitHub repo with clear setup instructions,
10. be deployable later with minimal architectural change.

---

## 26) Recommended prompt for Claude Code or Codex

Copy and paste the following:

---

# Prompt starts

Build a first-pass web application called **Smart People Analytics Assistant**.

## Product goal
Create an executive-friendly people analytics application that ingests HR datasets or even schema-only field inventories, then clearly distinguishes:
- what is directly known from the data,
- what can be derived,
- what is assumed,
- what is unknown or missing.

The application is for workforce analytics, especially:
- headcount trend analysis,
- attrition analysis,
- staffing and capability gap conversations,
- data quality and process gap detection.

This is not just a dashboard. It is a **people analytics observability + gap intelligence tool**.

## Technical requirements
Use:
- Next.js
- TypeScript
- Tailwind
- a clean component architecture
- server-side API routes for AI calls
- environment variables for secrets
- a modular monolith structure
- local file-based or DuckDB-backed analysis for MVP
- clean code, readable types, and thorough README documentation

The repository should be GitHub-ready and easy to deploy later to Netlify. Design the data layer so it can later be swapped to Supabase/Postgres without rewriting the whole app.

## UX requirements
The app should feel executive-friendly, modern, and calm. It should clearly communicate:
- what we know,
- what we do not know,
- what is only partially supported,
- what should change next.

Use a design language that emphasizes trust, clarity, and honesty over visual noise.

## Core screens
Create the following screens:

1. **Upload / Project Setup**
   - upload one or more CSV files
   - upload alternatively a schema manifest without raw data
   - show parsing status and basic metadata

2. **Data Profile**
   - row counts, column counts, inferred types
   - null rates
   - duplicate checks
   - date parsing checks
   - categorical distribution previews
   - warnings

3. **Field Mapping**
   - map source columns into canonical fields
   - support auto-suggestions and manual overrides
   - show mapping confidence

4. **Coverage Matrix**
   - rows = business questions
   - columns = required concepts or fields
   - cell states = available / derived / partial / missing / low confidence

5. **Gap Register**
   - list data gaps, quality gaps, process gaps, and capability gaps
   - each item should include why it matters and recommended next action

6. **Headcount Explorer**
   - trend charts
   - org / department / job breakdowns
   - month-over-month changes

7. **Attrition Explorer**
   - terms over time
   - reason distribution
   - voluntary / involuntary inferred mapping
   - transfer normalization
   - tenure buckets if derivable

8. **Executive Summary**
   - top findings
   - top unknowns
   - quality score
   - question answerability summary
   - recommended next steps

9. **AI Analyst Chat**
   - grounded in uploaded data and metadata
   - answer business questions
   - always separate known / derived / assumed / unknown

## Data structures to support
The first pass should be designed around workforce data similar to the following examples.

### Headcount snapshot example fields
- YEAR
- Year-Month
- Date
- EmpNo
- First Name
- Last Name
- Status
- Date of Seniority
- Date of Last Hire
- Date of Original Hire
- Company Code
- Company
- ejhorglvl1
- Organization
- ejhorglvl2
- Department
- Project
- ejhorglvl3
- Business Line
- ejhorglvl4
- AllocationCC
- Location Code
- JobCode
- Job
- FLSA Type
- FT or PT
- LocalUnion
- EE Type
- Supervisor

### Hire / termination event example fields
- Type
- YEAR
- Year-Month
- Company Code
- Employee Number
- Employee Name (Last Suffix, First MI)
- Effective Date
- Employee Status Code
- Reason Code
- Reason
- EjhOrgLvl1
- Organization
- EjhOrgLvl2
- Department
- EjhOrgLvl3
- Business Line
- EjhOrgLvl4
- AllocationCC
- Job Code
- Job
- Employee Type Code
- Employee Type
- Annual Salary

## Important business logic
Implement the following logic carefully:

1. Internal transfers (`Transferred in`, `Transferred out`) are not the same as external net hires or true attrition and should be handled separately by default.

2. Business questions should be evaluated for answerability:
   - direct
   - partial
   - not answerable

3. Every answer should explicitly distinguish:
   - known
   - derived
   - assumed
   - unknown
   - contested (if relevant)

4. The app should detect likely missing concepts that matter for strong attrition analysis, including:
   - sentiment
   - exit interview data
   - regrettable attrition flag
   - engagement
   - performance
   - promotion history
   - manager context
   - compensation progression
   - recruiting funnel context
   - standardized voluntary / involuntary classification
   - demographic fields if required for fairness analysis

5. The app should identify whether the gap is:
   - missing data
   - poor data quality
   - missing process
   - weak governance / ownership

## Starter business question library
Include at least these:
- What is monthly active headcount?
- Where is headcount growing or shrinking?
- What are hires, terms, and transfers over time?
- What are the top termination reasons?
- Can we reliably explain why people are leaving?
- Which questions are not answerable with the current dataset?
- What additional fields or process changes would most improve decision quality?

## AI requirements
Integrate OpenAI via server-side API calls only.
Do not expose keys in the client.

Use OpenAI for:
- schema interpretation,
- field mapping suggestions,
- question answerability analysis,
- gap diagnosis,
- executive summary generation.

Use **structured outputs** so the model returns JSON that matches a defined schema.

Implement an internal system prompt that makes the model act like a senior people analytics architect. The model must:
- never invent fields,
- never overclaim causation,
- explain limitations,
- recommend next-best actions,
- optimize for executive clarity and methodological honesty.

## Output schema for AI analyses
Create a shared JSON schema like this:
- question_id
- answerability
- confidence
- knowns[]
- unknowns[]
- assumptions[]
- quality_risks[]
- recommendations[]
- executive_summary

## Engineering requirements
- clean TypeScript types
- reusable domain models
- testable utility functions
- modular business logic
- clear README
- sample data loader
- mock mode if no OpenAI key is present
- polished empty states and error states
- simple but professional visual design

## Deliverables
Generate:
1. full codebase
2. README with setup and deployment notes
3. `.env.example`
4. sample seeded demo
5. clear comments where future Supabase persistence can be added
6. a small canonical question library
7. a starter canonical field dictionary
8. tests for core logic

## Design emphasis
The app should help a leadership team say:
- Here is what the data supports.
- Here is what it does not support.
- Here is what is missing.
- Here is what we should change next.

Do not build an overcomplicated enterprise platform. Build a sharp, credible first pass.

# Prompt ends

---

## 27) Final recommendation

For the first pass, optimize for **credibility, structure, and speed**, not for maximal sophistication.

The best initial version is one that:
- handles messy HR exports gracefully,
- makes uncertainty visible,
- highlights measurement and process gaps,
- supports executive storytelling,
- creates a stable foundation for later warehouse, survey, ATS, and ML expansion.

That is the right wedge.
