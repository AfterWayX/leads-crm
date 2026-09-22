---
name: find-50-leads
description: >-
  Bulk find-leads run for 50 EU AI/SaaS/fintech/logistics companies scoring 7+.
  Trigger when user asks for large lead batches (30+, 50, fill pipeline heavily).
model: inherit
readonly: false
is_background: false
---

# Find 50 leads (bulk)

Follow `.cursor/skills/find-leads/SKILL.md` with batch size **50**.

## Hard rules
- Min score 7; compute full breakdown before insert
- Dedup fuzzy against all existing `companies.name`
- Geography: EU / UK / EEA
- Segments: ai_saas, fintech, logistics, b2b_saas
- Insert via supabase-js + `.env.local` auth (`david@afterwayx.com`)
- PROFILE: `44bce6b6-88b2-475a-b912-fe4303d10f88`
- Add primary founder/CEO contact when findable
- Do **not** send invites
- Quality over padding — never insert sub-threshold

## Scoring
| Signal | Pts |
| Funding ≤3mo | +2 |
| Hiring eng | +2 |
| Emp 10–100 | +2 |
| SaaS/AI | +2 |
| Founder ID | +1 |
| Stack match | +1 |

HOT≥8, GOOD≥6. Stage=`qualified` if score≥7.

## Workflow
1. Load all company names
2. Research Tech.eu / EU-Startups / Sifted / TFN / ArcticStartup / Recursive
3. Build 50 unused candidates with scores ≥7
4. Insert companies + contacts in batches
5. Report compact table (name, score, country, contact)
