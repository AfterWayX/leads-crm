---
name: recruiter-outreach
description: >-
  Finds recruiters for applied jobs in the Leads CRM, sends LinkedIn connection
  invites with a short job-specific note using the shared invite cap, and sends
  a follow-up message after acceptance. Use automatically when the user asks to
  find recruiters for applied jobs, contact hiring teams, run recruiter
  outreach, or message recruiters about applications.
---

# Recruiter outreach (auto-run)

When the user asks to find recruiters for jobs they applied to or contact recruiters about applications, execute immediately.

## Scope

- Supabase project: `enybzqvjrjdpepikjmwl`
- Browser: `cursor-ide-browser` with the user's logged-in LinkedIn session
- Tables: `job_applications`, `job_contacts`, `job_outreach`
- Only process jobs with `stage in ('applied', 'screening', 'interview')`
- The invite cap is shared with B2B invites: 10/day and 80/week

## 1. Load jobs and existing outreach

Load jobs needing recruiter work:

```sql
select id, company_name, title, applied_at, recruiter_stage, notes
from job_applications
where stage in ('applied', 'screening', 'interview')
  and recruiter_stage in ('to_find', 'recruiter_found')
order by priority asc, fit_score desc, applied_at asc nulls last;
```

Load existing contacts and outreach before inserting or sending anything. Never create a second `job_contacts` row for the same verified LinkedIn URL or a second invite/message for the same job contact, regardless of the existing outreach status.

## 2. Find and save recruiters

For each job without a recruiter:

1. Search LinkedIn people for `{company_name} recruiter`, then `{company_name} talent acquisition`, then `{company_name} hiring`.
2. Prefer a person whose title includes recruiter, talent acquisition, technical recruiting, people, or hiring.
3. Open the profile and verify the name, title, and LinkedIn URL.
4. Insert one `job_contacts` row with `linkedin_verified = true`; set `recruiter_stage = 'recruiter_found'`.
5. If no credible recruiter is found, set `recruiter_stage = 'no_recruiter'` and report the job.

## 3. Send connection invites

Before every batch and immediately before each browser send, run:

```sql
select public.invite_capacity();
```

Use `min(remaining_today, remaining_week)` as the maximum number of recruiter invites. Recalculate this value after every confirmed send; if it reaches zero, stop before opening another profile.

1. Confirm no `job_outreach` invite already exists for the same job/contact, regardless of status.
2. Open the recruiter's LinkedIn profile.
3. Click `Connect`, then `Add a note`.
4. Use `generateRecruiterInviteNote(job, contact)` and verify the actual note is under 200 characters:
   `Hi {firstName}, I applied for the {title} role at {company}. I'd be glad to connect and share relevant experience.`
5. Send the invitation. Never send a B2B-style pitch in this note.
6. Insert `job_outreach` with `kind = 'invite'`, `status = 'pending'`, `channel = 'linkedin'`, the note in `body`, and `sent_at = now()`.
7. Set the job's `recruiter_stage = 'invite_sent'`.

Stop if LinkedIn shows a challenge, rate limit, login prompt, or ambiguous state. Do not count an invite until the browser confirms it was sent.

## 4. Check acceptance and send the job message

For pending recruiter invites, open each LinkedIn profile:

- A visible `Message`, `Connected`, or `1st`-degree state on the profile means accepted; do not infer acceptance from search results or a missing Connect button.
- `Pending` means leave the invite pending.
- An unclear state means leave it pending and report it.

When accepted:

1. Update the invite to `status = 'accepted'`.
2. Set `recruiter_stage = 'accepted'` before preparing the message.
3. Reuse an existing draft/approved message row for that job/contact; if none exists, create one draft with `generateRecruiterDm(job, contact)`. If a message is already `sent` or `replied`, skip it.
4. If `applied_at` is null, leave the draft unsent and report the missing application date.
5. Otherwise send only after acceptance. Keep it under 400 characters and mention the role and application date:
   `Hi {firstName}, I applied for the {title} role at {company} on {date}. My background in React, Next.js, TypeScript and Node.js looks relevant. Happy to share more context or answer questions.`
6. Mark the message `status = 'sent'`, `sent_at = now()`, and set `recruiter_stage = 'message_sent'` only after LinkedIn confirms the DM was sent.

## 5. Report

Report:

- Recruiters found and jobs marked `recruiter_found`
- Jobs with no credible recruiter
- Invites sent, pending, accepted, and skipped
- Messages sent or left as drafts
- Remaining shared daily and weekly capacity, fetched with `select public.invite_capacity()` after processing
