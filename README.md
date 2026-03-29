# People Analytics Pal

An executive-friendly **people analytics observability and gap intelligence** tool.

This application ingests HR datasets (headcount snapshots, hire/termination events) and clearly distinguishes:
- **Known** — directly observed in uploaded data
- **Derived** — computed with transparent logic
- **Assumed** — requires a business rule or classification
- **Unknown** — not captured or too unreliable

This is not a dashboard. It is a decision-support system designed to reveal gaps in data, process, and organizational capability.

---

## Core Screens

| Screen | Description |
|---|---|
| **Dashboard** | Executive overview: headcount trend, hire/term volumes, data trust score |
| **Upload** | Upload CSVs or load demo data |
| **Data Profile** | Column stats, null rates, quality scores, duplicate checks |
| **Field Mapping** | Map source columns to canonical workforce schema |
| **Coverage Matrix** | Question answerability: direct / partial / not answerable |
| **Gap Register** | Data, quality, process, and capability gaps |
| **Headcount Explorer** | Monthly trends, segment breakdowns, anomaly detection |
| **Attrition Explorer** | Events by type, reason distribution, voluntary/involuntary split, tenure buckets |
| **Executive Summary** | Top findings, quality score, recommendations |
| **AI Analyst Chat** | Ask business questions grounded in uploaded data |

---

## Setup

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/adtrei/peopleanalyticspal.git
cd peopleanalyticspal
npm install
```

### Environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Optional — app runs in mock mode without it
OPENAI_API_KEY=sk-...

# Optional — defaults to gpt-4o-mini
OPENAI_MODEL=gpt-4o-mini
```

> If `OPENAI_API_KEY` is not set, the app runs in **mock mode**: all AI features return simulated responses so you can explore the full UX without an API key.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Quick start (demo mode)

1. Open the app at http://localhost:3000
2. Click **"Load demo data"** on the Upload page or Dashboard
3. Navigate to **Coverage Matrix** and click **"Run Analysis"**
4. Explore **Gap Register**, **Executive Summary**, and **AI Analyst Chat**

---

## Uploading your own data

### Supported file types
- **Headcount snapshots** — monthly employee-level CSV files (e.g. `Headcount Snapshot Mar 2024.csv`)
- **Hire / Termination events** — event-level CSV files (e.g. `Hires and Terms 2024.csv`)
- **Schema manifests** — field inventory files without raw data

### File naming hints
The app auto-detects file type from the filename:
- Contains `headcount` or `snapshot` → treated as HCM snapshot
- Contains `hire`, `term`, or `event` → treated as workforce events

### Expected headcount fields
| Source Field | Canonical Mapping |
|---|---|
| EmpNo / Employee Number | `employee_id` |
| Year-Month | `snapshot_month` |
| Status | `status` |
| Organization | `organization` |
| Department | `department` |
| Business Line | `business_line` |
| Job | `job` |
| Annual Salary | `annual_salary` |
| Supervisor | `supervisor` |
| Date of Last Hire | `date_of_last_hire` |

Field mapping can be manually corrected on the **Field Mapping** screen.

---

## Business logic

### Transfer normalization
Internal transfers (`Transferred in`, `Transferred out`) are **excluded from net hire/attrition counts by default**. This prevents double-counting in workforce planning calculations.

### Voluntary / involuntary classification
Voluntary/involuntary attrition is **inferred from reason text** using a keyword-based taxonomy. This is labeled `assumed` throughout the UI. A standardized flag in the source system would improve reliability.

### Tenure calculation
Tenure is **derived** from `Date of Last Hire` vs the event date. Employees without a hire date on record are excluded from tenure analysis.

### Question answerability
Each business question is evaluated against 7 dimensions:
1. Field presence
2. Field completeness
3. Mapping confidence
4. Temporal coverage
5. Joinability
6. Semantic adequacy
7. Need for human/process context

Results are labeled `direct`, `partial`, or `not_answerable`.

---

## Architecture

```
/app                    # Next.js App Router pages + API routes
  /api/upload           # CSV ingest + profiling
  /api/profile          # Project state read
  /api/mapping          # Field mapping CRUD
  /api/analyze          # Coverage + gap analysis
  /api/chat             # AI analyst chat (server-side only)
  /api/demo             # Demo data loader

/components             # Reusable UI components
  /ui                   # Layout, badges, KPI cards, empty states
  /charts               # Recharts wrappers

/lib
  /analytics            # Headcount, attrition, coverage, gap engines
  /ai                   # OpenAI client with mock fallback
  /quality              # Data quality checks
  /schema               # Column profiler + field mapper
  /db                   # In-memory store (FUTURE: replace with Supabase)

/types                  # TypeScript domain types
/data                   # Question library, canonical field dictionary, sample data
/__tests__              # Jest tests for core logic
```

### Future: Supabase persistence

The in-memory store (`lib/db/store.ts`) mirrors the planned Supabase schema.
Each function is annotated with the future SQL operation.
When ready, replace the store module with Supabase client calls — no page or API logic changes needed.

Tables planned: `datasets`, `column_profiles`, `canonical_field_maps`, `data_quality_scores`, `question_coverage_results`, `gap_register`

---

## Deployment

### Netlify

```bash
npm run build
# Set OPENAI_API_KEY in Netlify environment variables (optional)
```

### Vercel

```bash
vercel --prod
```

---

## Tests

```bash
npm test
```

Tests cover attrition analytics, column profiler, question coverage, and field mapper.

---

## Known limitations (MVP)

- **In-memory only** — data is lost on server restart. Future: Supabase persistence.
- **No auth** — Future: Supabase Auth + RLS.
- **OpenAI only** — AI features require an OpenAI key. Mock mode covers full UX without one.
- **CSV only** — Excel and HCM API connectors are Phase 2.

---

## Roadmap

- **Phase 1** (current) — File upload, profiling, mapping, question answerability, gap register, executive summary, AI chat
- **Phase 2** — Saved projects, snapshot/event joins, supervisor-at-exit, export to memo format
- **Phase 3** — Supabase Postgres, auth, audit trail, scheduled refreshes
- **Phase 4** — Predictive models with explainability, survey + ATS integration

---

## Design principles

1. **Evidence first** — every insight points back to specific fields and quality status
2. **Known / derived / assumed / unknown must be visibly separate**
3. **Descriptive before predictive** — earn trust before adding predictions
4. **Correlation is not causation**
5. **Question-centered** — users care about business questions, not tables
6. **Privacy-preserving** — API keys never exposed to client
