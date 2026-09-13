-- Daily invite engine: separate invites from messages

alter table public.contacts
  add column if not exists linkedin_verified boolean not null default false;

-- Existing manually-reseed contacts are treated as verified
update public.contacts
set linkedin_verified = true
where linkedin_url is not null;

alter table public.outreach
  add column if not exists kind text not null default 'message';

-- Backfill existing LinkedIn invite rows
update public.outreach
set kind = 'invite'
where subject ilike 'LinkedIn invite%'
   or status = 'pending';

create index if not exists outreach_kind_status_idx
  on public.outreach(kind, status);

create or replace function public.invite_capacity()
returns json
language sql
stable
security invoker
as $$
  with caps as (
    select
      10::int as daily_cap,
      80::int as weekly_cap
  ),
  counts as (
    select
      count(*) filter (
        where o.sent_at >= date_trunc('day', now() at time zone 'utc')
      )::int as sent_today,
      count(*) filter (
        where o.sent_at >= now() - interval '7 days'
      )::int as sent_7d
    from public.outreach o
    where o.kind = 'invite'
      and o.sent_at is not null
      and o.status in ('pending', 'accepted', 'sent', 'ignored')
  )
  select json_build_object(
    'sent_today', c.sent_today,
    'sent_7d', c.sent_7d,
    'daily_cap', caps.daily_cap,
    'weekly_cap', caps.weekly_cap,
    'remaining_today', greatest(0, caps.daily_cap - c.sent_today),
    'remaining_week', greatest(0, caps.weekly_cap - c.sent_7d)
  )
  from counts c, caps;
$$;

grant execute on function public.invite_capacity() to authenticated;
