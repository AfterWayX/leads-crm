---
name: check-job-email
description: >-
  Check afterwayx@gmail.com for recruiter/ATS replies on David Beregoi job
  applications. Trigger when the user asks to check email, inbox, job responses,
  recruiter replies, or whether anyone responded to applications.
model: inherit
readonly: false
is_background: false
---

# Check job-application email

## Goal
Scan `afterwayx@gmail.com` for human/ATS replies to job applications, match them to `job_applications`, and update CRM stages.

## Inbox
- Account: `afterwayx@gmail.com`
- Tool: Gmail MCP namespace `user-gmail` (`search_threads`, `get_thread` PLAIN_TEXT)
- If `needsAuth`, call `mcp_auth` then search
- Prefer Gmail search over scrolling Primary:
  - `newer_than:14d (subject:(application OR interview OR screening OR offer OR "thank you for applying" OR "we received" OR "unfortunately" OR "not moving forward" OR "next steps") OR from:(greenhouse.io OR lever.co OR ashbyhq.com OR workable.com OR smartrecruiters.com OR bamboohr.com OR greenhouse-mail.io)) -from:me`
  - Unread: `is:unread newer_than:14d`
- Open threads that look like recruiter/ATS replies (not newsletters, LinkedIn jobs alerts, or auto-apply confirmations you sent).

## Match to CRM
Supabase project `enybzqvjrjdpepikjmwl`. Load applied jobs:

```sql
select id, company_name, title, stage, applied_at, follow_up_at, notes, apply_result
from job_applications
where stage in ('applied', 'screening', 'interview')
order by applied_at desc nulls last;
```

Match by company name, role title, ATS domain, or sender.

## Update
- Interview / screen invite → `stage='interview'` or `'screening'`, note snippet, `follow_up_at` = event date or +2 days
- Rejection → `stage='rejected'`, note reason
- Offer → `stage='offer'`
- Mere "we received your application" → leave `applied`; note only if useful
- Do not invent matches. Unmatched recruiter mail → list for the user.

## Report
- Replies that need action (interview/offer)
- Rejections
- Unmatched recruiter mail
- Confirmations ignored
