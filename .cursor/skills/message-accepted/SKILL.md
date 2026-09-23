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
- Browser: **cursor-ide-browser** (user must be logged into LinkedIn). Follow `.cursor/skills/_shared/linkedin-browser.md` (probe + JS clicks; no full snapshots/screenshots unless `unclear`)
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
2. Run the profile probe
3. Interpret:
   - `connected` → **accepted**
   - `pending` → still waiting (leave as pending)
   - `connect` → invite gone without connection: mark `ignored` if clearly withdrawn/expired; otherwise leave pending
   - `unclear` → one scoped snapshot; still unclear → leave pending
   - `blocked` → stop and report
4. On accept, update CRM:
   ```sql
   update outreach set status = 'accepted', kind = 'invite'
   where id = '<outreach_id>';
   ```

### 3. Draft DM (if none exists)

Match `generateLinkedInDm` in `src/lib/templates.ts`. Keep it **≤400 chars**.

**Writing (anti-AI tells):** never use an em dash (`—`) or en dash (`–`) in message body or subject. They read as AI. Use a period, comma, colon, or rewrite the sentence. Do not use ` - ` as a stand-in for the same pause.

```
Hi {firstName}, thanks for connecting.

{opener} {offerLine}

Open to a short chat if useful?
```

Openers by `trigger_type`:
- `funding` → `Congrats on the {amount/round} raise at {company}.` (or “recent raise”)
- `hiring` → `Noticed {company} is hiring engineers ({roles}).`
- `product_launch` → `Saw the recent launch at {company}. Looks sharp.`
- `small_team` → `Been following {company}. Impressive what a lean team is shipping.`
- default → `Been following {company}.`

Offer lines by `offer_type`:
- `team_extension` → embed senior React/Node/AI engineers…
- `mvp` → specs to production…
- `ai_dev` → production React/Next/NestJS, AI features when they fit; RAG/LLM as a supporting capability…
- `legacy_perf` → modernize React/Node for performance…
- default → team_extension line

Insert draft if missing:

```sql
insert into outreach (
  company_id, contact_id, channel, kind, status, subject, body, created_by
) values (
  '<company_id>', '<contact_id>', 'linkedin', 'message', 'draft',
  'DM: <company>', '<body>',
  (select id from profiles order by created_at limit 1)
);
```

### 4. Send the LinkedIn message

For each accepted contact with a draft/approved message (and LinkedIn URL):

1. Open profile → JS click **Message**
2. Paste the draft body into the composer via scoped snapshot ref (do not invent a longer pitch)
3. Send, then run the verify-sent probe
4. Mark CRM:
   ```sql
   update outreach
   set status = 'sent', sent_at = now(), kind = 'message'
   where id = '<message_outreach_id>';

   update companies
   set stage = 'message_sent'
   where id = '<company_id>'
     and stage in ('found', 'qualified', 'contacted', 'invite_sent');
   ```
5. If LinkedIn blocks messaging or UI fails → leave as `draft`/`approved`, note in report, continue

Pace between sends; stop on rate-limit / challenge and report remaining.

### 5. Report

- Pending still waiting
- Newly marked accepted
- Messages sent (contact, company)
- Drafts left unsent + reason

Skip companies already messaged (`status='sent'` for that contact). Never re-send the same DM.
