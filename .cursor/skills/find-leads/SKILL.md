---
name: find-leads
description: >-
  Discovers and inserts EU SaaS/AI/fintech/logistics companies into the AfterWayX
  Leads CRM that will score 7+ (or the user's stated threshold). Use automatically
  when the user asks to find leads, find more leads, source companies, add prospects,
  top up the pipeline, or hunt HOT/GOOD companies — without waiting for confirmation.
---

# Find leads (auto-run)

When the user asks to find leads, **execute immediately**. Do not ask whether to proceed. Only ask if a required detail is missing (e.g. score floor when unclear and not 7+).

## Defaults

- **Min score**: 7 (unless user says otherwise, e.g. "6+", "HOT only")
- **Geography**: EU / UK / EEA startups
- **Segments**: `ai_saas`, `fintech`, `logistics`, `b2b_saas` (prefer AI/SaaS)
- **Supabase project**: `enybzqvjrjdpepikjmwl`
- **Source labels**: Tech.eu, EU-Startups, Dealroom, Sifted, Crunchbase, LinkedIn

## Scoring (must match `src/lib/scoring.ts`)

| Signal | Points |
|--------|--------|
| Funding date ≤ 3 months | +2 |
| Hiring (devs/engineers) | +2 |
| Employees 10–100 | +2 |
| Segment/industry SaaS or AI | +2 |
| Founder/CTO contact identified | +1 |
| Stack match (react, next, node, typescript, ai, llm, python) | +1 |

Temperature: HOT ≥8, GOOD ≥6, MAYBE ≥4. Only insert companies that meet the min score **after** computing the full breakdown.

## Workflow

1. **Load existing names** via Supabase MCP `execute_sql` on project `enybzqvjrjdpepikjmwl`:
   ```sql
   select lower(name) as name from companies;
   ```
   Skip duplicates (fuzzy name match).

2. **Research** recent EU funding / hiring (web search: Tech.eu, EU-Startups, Dealroom, Sifted). Prefer Seed–Series A, recent funding, hiring engineers, 10–100 employees.

3. **Score each candidate** with an explicit breakdown. Discard anything under the min score.

4. **Insert companies** with `execute_sql`. Set:
   - `score`, `score_breakdown` (jsonb), `temperature`
   - `stage` = `qualified` if score ≥7 else `found`
   - `trigger_type` / `offer_type` from context (funding→`funding`, hiring→`hiring`; offers: `ai_dev`, `team_extension`, `mvp`, `legacy_perf`)
   - `created_by` = first profile id: `select id from profiles order by created_at limit 1`
   - `reason` = short why (funding + size + hiring)

5. **Add primary contacts** for the strongest companies (founder/CEO/CTO) when LinkedIn URL is findable:
   - `is_primary=true`, `linkedin_verified=false`
   - Prefer one contact per company unless two clear decision-makers

6. **Report** a compact table: name, score, country, segment, contact(s) — then stop. Do not send invites unless the user also asked for that.

## Target batch size

- Default: **10–15** new companies per request
- If user says "a few" → ~5; "many" / "fill the pipeline" → up to 20
- Quality over volume: never pad with sub-threshold companies
