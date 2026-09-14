---
name: send-invites
description: >-
  Sends today's LinkedIn connection invites for the AfterWayX Leads CRM Daily 10
  engine (queue in Supabase, click Connect on LinkedIn without a note, mark pending).
  Use automatically when the user asks to send invites, run today's batch, invite
  leads, connect on LinkedIn, or process the Daily 10 — without waiting for confirmation.
---

# Send invites (auto-run)

When the user asks to send invites, **execute immediately**. Do not ask whether to proceed. Cap enforcement is mandatory.

## Caps & rules

- **10 invites/day**, **80/week** — check RPC first: `select public.invite_capacity();`
- `remaining = min(remaining_today, remaining_week)`. If 0 → report capacity and stop.
- **One contact per company** (no second invite while company has queued/pending/accepted invite)
- **21-day** re-invite cooldown per contact
- Invites are **always without a note** (`Send without a note`)
- Supabase project: `enybzqvjrjdpepikjmwl`

## Workflow

### 1. Capacity + queue

```sql
select public.invite_capacity();
```

Load queued invites (`kind='invite'`, `status='queued'`) with contact LinkedIn URL, company name, score.

If fewer queued than `remaining`, top up the queue (same eligibility as `src/lib/invites.ts` / `/today` batch):
- Contact has `linkedin_url`
- Company not blocked by queued/pending/accepted invite
- Contact not invited in last 21 days
- Prefer primary, then score desc, HOT→GOOD
- Insert `outreach` rows: `kind='invite'`, `status='queued'`, `channel='linkedin'`, subject `LinkedIn invite — {name}`, body `Queued for today's Daily 10. Send without a note.`

### 2. LinkedIn send (browser)

Use **cursor-ide-browser** (local session — user must already be logged into LinkedIn).

For each queued invite up to `remaining`:

1. `browser_navigate` to `contact.linkedin_url`
2. Snapshot; if already **Pending** or **Connected** → skip send, still mark CRM appropriately (pending / accepted)
3. Click **Connect** (or **More → Connect**)
4. Click **Send without a note** — never add a note
5. Confirm Pending on profile when possible
6. Update CRM immediately:
   ```sql
   update outreach
   set status = 'pending', sent_at = now(), kind = 'invite'
   where id = '<outreach_id>';

   update companies
   set stage = 'invite_sent'
   where id = '<company_id>' and stage in ('found', 'qualified', 'contacted');
   ```

Pace: short pause between profiles; stop early if LinkedIn rate-limits or challenges appear — report what was sent and what remains.

### 3. Report

- Sent count, remaining capacity today/week
- List: contact, company, score, LinkedIn status
- Skipped (already pending / no Connect / cap)

Do **not** send follow-up DMs in this skill unless the user explicitly asks to message accepted connections.
