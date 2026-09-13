# Leads CRM

Prospecting CRM for AfterWayX — qualified European SaaS / AI / Fintech / Logistics leads.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind + shadcn/ui
- **Supabase** Auth + Postgres (no ORM — `@supabase/supabase-js` + `@supabase/ssr`)
- Deployed on **Vercel**

## Setup

```bash
pnpm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
pnpm dev
```

## Funnel stages

`found → qualified → contacted → replied → call → opportunity → proposal → client` (or `lost`)

## Scoring (max 10)

| Signal | Points |
|--------|--------|
| Funding in last 3 months | +2 |
| Hiring developers | +2 |
| 10–100 employees | +2 |
| SaaS / AI product | +2 |
| CTO / Founder identified | +1 |
| Stack match (React/Next/Node/AI) | +1 |

Temperatures: **HOT** 8–10 · **GOOD** 6–7 · **MAYBE** 4–5 · **IGNORE** 0–3

## Segment targets (first 100)

30 AI/SaaS · 20 Fintech · 20 Logistics · 20 B2B SaaS · 10 wild cards

## Job hunt tracker

Separate from the B2B leads funnel. Nav → **Jobs** / **Auto-apply**.

```bash
# Apply migrations in Supabase (includes job_applications + seed roles + auto-apply)
# supabase db push   # or run SQL in Dashboard
```

- Stages: `saved → applied → screening → interview → offer` (or rejected/withdrawn)
- Fit score uses stack match, Moldova eligibility, region, salary, seniority in title
- Curated list + rewritten CV: `docs/job-hunt/`
- **Auto-apply:** profile + PDF + cover letters; run with `run auto-apply batch` (see `scripts/auto-apply-engine-prompt.txt`). Skips LinkedIn Easy Apply bots; uses ATS/email.

## Notes

- Outreach is **manual**: generate draft → approve → you send → mark sent.
- In Supabase Auth settings, disable “Confirm email” for faster team signup in early use, or confirm via email.
