---
name: auto-apply
description: >-
  Runs David Beregoi’s job auto-apply batch for the Leads CRM (materials ready →
  external ATS / Gmail apply → mark applied). Use automatically when the user
  says run auto-apply batch, apply to jobs, auto apply, apply for me, send job
  applications, or process the job apply queue — without waiting for confirmation.
---

# Auto-apply (auto-run)

When the user asks to auto-apply / apply to jobs, **execute immediately**. Do not ask whether to proceed. Do not wait for per-field answers — use `applicant_profile` + `answer_bank` + cover letters + PDF.

## Defaults

- **Supabase project**: `enybzqvjrjdpepikjmwl`
- **Applicant email**: `afterwayx@gmail.com`
- **PDF CV**: `docs/job-hunt/David_Beregoi_CV.pdf`
- **Materials logic**: `src/lib/auto-apply.ts`
- **Engine notes**: `scripts/auto-apply-engine-prompt.txt`
- **Daily cap**: from RPC `public.auto_apply_capacity()` (default 8)
- **Pace**: 1 application every 2–4 minutes

## Hard rules

1. **Never** auto-submit LinkedIn Easy Apply. LinkedIn-only → `apply_queue_status='skipped'` or `'blocked'` with reason, continue.
2. Prefer **company ATS** (Ashby, Greenhouse, Lever, Workable, BambooHR, SmartRecruiters) and **careers email**.
3. **Never invent** employer emails — only `careers_email` on the row or an address published on the company careers page.
4. Stop when `remaining_today = 0`.
5. CAPTCHA / login / MFA / file-upload failure → mark `blocked` with clear reason; **do not loop**.
6. Use only `afterwayx@gmail.com` (no disposable accounts).
7. Moldova / remote / salary answers come from `applicant_profile.answer_bank` — do not contradict them.

## Workflow

### 1. Capacity + profile

```sql
select public.auto_apply_capacity();
select * from applicant_profile order by created_at limit 1;
```

If `remaining_today = 0` → report and stop.  
If no profile or `auto_apply_enabled = false` → report and stop.  
Confirm PDF exists at `docs/job-hunt/David_Beregoi_CV.pdf`.

### 2. Ensure materials

Load candidates (priority A/B first):

```sql
select *
from job_applications
where apply_queue_status in ('queued', 'materials_ready')
   or (
     stage = 'saved'
     and priority in ('A', 'B')
     and moldova_eligible = true
     and apply_mode <> 'manual'
     and apply_queue_status in ('idle', 'blocked')
   )
order by priority asc, fit_score desc
limit 20;
```

For rows missing `cover_letter` / empty `tailored_answers`:
- Generate with the same logic as `generateCoverLetter` + `buildTailoredAnswers` in `src/lib/auto-apply.ts`
- Update:
  - `apply_queue_status = 'materials_ready'`
  - `materials_ready_at = now()`
  - `blocked_reason = null`

Skip / mark LinkedIn-only rows per hard rule 1.

### 3. Apply up to `remaining_today`

Take `materials_ready` rows ordered by `priority`, `fit_score` desc. Process one at a time.

#### Resolve apply URL

1. Open `apply_url` (browser).
2. Follow WithMira / Himalayas redirects to the **company ATS** URL.
3. Save `company_apply_url` on the row.
4. If signup walls hide the ATS → web search `"{company} {title} careers apply"` for a direct Ashby/Greenhouse/Lever/etc. link.
5. If no non-LinkedIn URL → `blocked` with `No external apply URL`, continue.

#### Mode: email

When `apply_mode = 'email'` and `careers_email` is set:

1. Gmail `send_message` to that address
2. Subject: `Application — {title} — David Beregoi`
3. Body: `cover_letter`
4. Attachment: PDF (`docs/job-hunt/David_Beregoi_CV.pdf`, mime `application/pdf`)
5. Mark applied (SQL below)

#### Mode: ats (default)

1. Open `company_apply_url` in **cursor-ide-browser**. Snapshot with `{ interactive: true, compact: true, selector: 'form' }` (fallback `'main'`); never full-page. No screenshots unless blocked. Detect success/CAPTCHA with a `Runtime.evaluate` text check, not a new snapshot. For redirects, read `location.href` via `Runtime.evaluate`
2. Fill fields from `tailored_answers` / `answer_bank` (name, email, phone, location, salary, work auth, experience, why company)
3. Upload CV PDF when a file input exists
4. Paste `cover_letter` into cover letter / additional info
5. Submit only if complete and **no CAPTCHA**
6. Success → mark applied; wall → mark blocked

#### Mark applied

```sql
update job_applications
set
  stage = 'applied',
  apply_queue_status = 'applied',
  applied_at = current_date,
  follow_up_at = current_date + 7,
  apply_result = '<short note + final URL>',
  last_apply_attempt_at = now(),
  blocked_reason = null
where id = '<job_id>';
```

#### Mark blocked

```sql
update job_applications
set
  apply_queue_status = 'blocked',
  blocked_reason = '<reason>',
  last_apply_attempt_at = now()
where id = '<job_id>';
```

### 4. Report

Compact summary:

- Applied count + remaining capacity today
- List applied: company, title, mode, URL
- List blocked: company, reason (what user must unblock once)
- Remind: say **run auto-apply batch** again tomorrow; LinkedIn Easy Apply is never auto-submitted

## Do not

- Ask the user to fill salary / citizenship / phone — already in profile
- Auto-submit LinkedIn Easy Apply
- Exceed the daily cap
- Invent careers emails
- Stop after preparing materials only — **apply** until cap or queue empty (unless every remaining row is blocked)
