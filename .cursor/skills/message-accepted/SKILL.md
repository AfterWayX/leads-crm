---
name: message-accepted
description: >-
  Checks LinkedIn for accepted connection invites in the AfterWayX Leads CRM,
  marks them accepted, drafts short DMs, and sends the messages. Use automatically
  when the user asks to check accepted invites, message accepted connections,
  follow up accepts, send DMs to people who accepted, or process accepted invitations.
---

# Message accepted invites (auto-run)

When the user asks to check accepts / message people who accepted, **execute immediately**. Do not ask whether to proceed.

## Scope

- Supabase project: `enybzqvjrjdpepikjmwl`
- Browser: **cursor-ide-browser** (user must be logged into LinkedIn)
- Do **not** send new connection invites here (that is `send-invites`)

## Workflow

### 1. Load pending invites from CRM

```sql
select o.id as outreach_id, o.company_id, o.contact_id, o.sent_at,
       c.name as contact_name, c.linkedin_url,
       co.name as company_name, co.funding_amount_eur, co.funding_round,
       co.hiring_roles, co.offer_type, co.trigger_type, co.score
from outreach o
join contacts c on c.id = o.contact_id
join companies co on co.id = o.company_id
where o.kind = 'invite' and o.status = 'pending'
  and c.linkedin_url is not null
order by o.sent_at nulls last;
```

Also load already-accepted invites that still need a message:

```sql
select o.id as invite_id, o.company_id, o.contact_id,
       c.name, c.linkedin_url, co.name as company_name,
       co.funding_amount_eur, co.funding_round, co.hiring_roles,
       co.offer_type, co.trigger_type
from outreach o
join contacts c on c.id = o.contact_id
join companies co on co.id = o.company_id
where o.kind = 'invite' and o.status = 'accepted'
  and not exists (
    select 1 from outreach m
    where m.kind = 'message' and m.contact_id = o.contact_id
      and m.status in ('draft', 'approved', 'sent')
  );
```

### 2. Detect accepts on LinkedIn

For each **pending** invite:

1. Navigate to `linkedin_url`
2. Snapshot the profile
3. Interpret:
   - **Message** / **Connected** / 1st-degree → **accepted**
   - **Pending** → still waiting (leave as pending)
   - **Connect** again / invite gone without connection → mark `ignored` if clearly withdrawn/expired; otherwise leave pending
4. On accept, update CRM:
   ```sql
   update outreach set status = 'accepted', kind = 'invite'
   where id = '<outreach_id>';
   ```

### 3. Draft DM (if none exists)

Match `generateLinkedInDm` in `src/lib/templates.ts` — **≤400 chars**:

```
Hi {firstName}, thanks for connecting.

{opener} {offerLine}

Open to a short chat if useful?
```

Openers by `trigger_type`:
- `funding` → `Congrats on the {amount/round} raise at {company}.` (or “recent raise”)
- `hiring` → `Noticed {company} is hiring engineers ({roles}).`
- `product_launch` → `Saw the recent launch at {company} — looks sharp.`
- `small_team` → `Been following {company} — impressive what a lean team is shipping.`
- default → `Been following {company}.`

Offer lines by `offer_type`:
- `team_extension` → embed senior React/Node/AI engineers…
- `mvp` → specs to production…
- `ai_dev` → LLM workflows, RAG, agents on React/Node…
- `legacy_perf` → modernize React/Node for performance…
- default → team_extension line

Insert draft if missing:

```sql
insert into outreach (
  company_id, contact_id, channel, kind, status, subject, body, created_by
) values (
  '<company_id>', '<contact_id>', 'linkedin', 'message', 'draft',
  'DM — <company>', '<body>',
  (select id from profiles order by created_at limit 1)
);
```

### 4. Send the LinkedIn message

For each accepted contact with a draft/approved message (and LinkedIn URL):

1. Open profile → click **Message**
2. Paste the draft body into the composer (do not invent a longer pitch)
3. Send
4. Mark CRM:
   ```sql
   update outreach
   set status = 'sent', sent_at = now(), kind = 'message'
   where id = '<message_outreach_id>';
   ```
5. If LinkedIn blocks messaging or UI fails → leave as `draft`/`approved`, note in report, continue

Pace between sends; stop on rate-limit / challenge and report remaining.

### 5. Report

- Pending still waiting
- Newly marked accepted
- Messages sent (contact, company)
- Drafts left unsent + reason

Skip companies already messaged (`status='sent'` for that contact). Never re-send the same DM.
