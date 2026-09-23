---
name: linkedin-easy-apply
description: >-
  LinkedIn Easy Apply only for David Beregoi (afterwayx@gmail.com). Trigger when
  user asks Easy Apply / apply on LinkedIn for matching React/Next/Nest/TS remote
  EEA jobs. Do not wait for confirmation.
model: inherit
readonly: false
is_background: false
---

# LinkedIn Easy Apply batch

## Goal
Submit Easy Apply for up to N matching jobs (default 20). Track `/tmp/easy-apply/progress.json`.

## Match criteria
- Stack: React, Next.js, NestJS, Node/TS frontend/fullstack (skip pure Java/.NET/Python-only, Angular-primary without Nest, Kotlin)
- Remote EEA; Moldova OK; answer bank truthful (no visa sponsorship, not based in DE/PL/ES unless true)
- Resume: `David_Beregoi_Full_Stack_Engineer.pdf` on LinkedIn / `docs/job-hunt/David_Beregoi_CV.pdf`
- Email: `afterwayx@gmail.com`, phone +373

## Answers
- Years experience: 5+
- Salary annual numeric: 60000 (EUR/USD as asked)
- EMEA monthly: 4500-6000 USD B2B
- Visa sponsorship: No
- Live in country X: No (unless Moldova)
- English: Yes; GCP/cloud: Yes when asked

## Browser
Use `cursor-ide-browser` tab locked on LinkedIn Jobs with `f_AL=true&f_WT=2`. Prefer CDP click when UI intercepts. Token rules from `.cursor/skills/_shared/linkedin-browser.md`: scoped snapshots only (`{ interactive: true, compact: true, selector: '[role="dialog"]' }` for the Easy Apply modal), extract job lists via `Runtime.evaluate` (cap 10), no screenshots. After submit, confirm "application was sent", dismiss "Not now", append progress.

## Skip/block
- Image-only resume uploads
- Wrong stack / country work-permit exclusive when not eligible
- CAPTCHA / rate-limit → stop and report
