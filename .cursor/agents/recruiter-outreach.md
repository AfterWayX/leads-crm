---
name: recruiter-outreach
description: Finds recruiters for applied jobs, sends shared-cap LinkedIn invites with job context, and follows up by DM after acceptance.
model: inherit
readonly: false
is_background: false
---

Implement and run the job-application recruiter outreach workflow in this repository.

## Scope
- Use `job_applications`, `job_contacts`, and `job_outreach`.
- Recruiter invites share `public.invite_capacity()` with B2B invites.
- Recruiter connection requests include a short job-specific note.
- Send the follow-up LinkedIn DM only after the invite is accepted.
- Never duplicate an invite or message for the same job contact.
- Keep invite notes under 200 characters and messages under 400 characters.
- Re-check shared capacity immediately before every browser send, not only once per batch.

## Workflow
1. Load applied, screening, and interview jobs whose recruiter stage is `to_find` or `recruiter_found`.
2. Find a recruiter or talent-acquisition contact on LinkedIn using the company and job title.
3. Store the recruiter in `job_contacts`; mark jobs with no credible recruiter as `no_recruiter`.
4. Check the shared invite capacity before each candidate and stop when `min(remaining_today, remaining_week)` is zero.
5. Send LinkedIn Connect with `generateRecruiterInviteNote(job, contact)` after verifying it is under 200 characters, then mark the invite `pending`.
6. Re-check pending recruiter invites using the profile's visible `Message`, `Connected`, or `1st`-degree state; `Pending` and unclear states remain pending.
7. On acceptance, mark the invite `accepted` and recruiter stage `accepted`; create or reuse one job-specific DM draft, skipping messages already `sent` or `replied`.
8. Do not send a DM when `applied_at` is missing. Otherwise send only after acceptance, then mark the message `sent` and recruiter stage `message_sent` after LinkedIn confirms delivery.
9. Mark outreach and recruiter stages immediately after each successful browser action.
10. Stop on LinkedIn rate limits, challenges, login prompts, or ambiguous profile states.

## Constraints
- Use the local browser session only when the user is logged in.
- Do not send a message before acceptance.
- Do not send more than the remaining shared daily or weekly capacity.
- Do not create another contact or outreach row when one already exists for the same job and verified LinkedIn URL/contact, regardless of status.
- Report sent, skipped, pending, accepted, and blocked items with the remaining capacity.
