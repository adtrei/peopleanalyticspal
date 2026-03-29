
# Smart People Analytics Assistant — Build Prompt for Claude Code / Codex

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

Use structured outputs so the model returns JSON that matches a defined schema.

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
