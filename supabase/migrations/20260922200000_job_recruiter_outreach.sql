-- Recruiter outreach pipeline for personal job applications.

alter table public.job_applications
  add column if not exists recruiter_stage text not null default 'to_find';

create index if not exists job_applications_recruiter_stage_idx
  on public.job_applications(recruiter_stage);

create table public.job_contacts (
  id uuid primary key default gen_random_uuid(),
  job_application_id uuid not null references public.job_applications(id) on delete cascade,
  name text not null,
  title text,
  linkedin_url text,
  email text,
  linkedin_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index job_contacts_job_application_idx
  on public.job_contacts(job_application_id);

alter table public.job_contacts enable row level security;

create policy "Authenticated can select job_contacts"
  on public.job_contacts for select to authenticated using (true);
create policy "Authenticated can insert job_contacts"
  on public.job_contacts for insert to authenticated with check (true);
create policy "Authenticated can update job_contacts"
  on public.job_contacts for update to authenticated using (true) with check (true);
create policy "Authenticated can delete job_contacts"
  on public.job_contacts for delete to authenticated using (true);

create table public.job_outreach (
  id uuid primary key default gen_random_uuid(),
  job_application_id uuid not null references public.job_applications(id) on delete cascade,
  job_contact_id uuid not null references public.job_contacts(id) on delete cascade,
  channel text not null default 'linkedin',
  kind text not null default 'message'
    check (kind in ('invite', 'message')),
  status text not null default 'draft'
    check (status in ('queued', 'pending', 'accepted', 'ignored', 'draft', 'approved', 'sent', 'replied', 'bounced')),
  subject text,
  body text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  replied_at timestamptz,
  follow_up_at date,
  response_notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index job_outreach_job_application_idx
  on public.job_outreach(job_application_id);
create index job_outreach_job_contact_idx
  on public.job_outreach(job_contact_id);
create index job_outreach_kind_status_idx
  on public.job_outreach(kind, status);
create index job_outreach_follow_up_idx
  on public.job_outreach(follow_up_at);
create unique index job_contacts_job_linkedin_url_unique_idx
  on public.job_contacts(job_application_id, linkedin_url)
  where linkedin_url is not null;
create unique index job_outreach_job_contact_kind_unique_idx
  on public.job_outreach(job_application_id, job_contact_id, kind);

alter table public.job_outreach enable row level security;

create policy "Authenticated can select job_outreach"
  on public.job_outreach for select to authenticated using (true);
create policy "Authenticated can insert job_outreach"
  on public.job_outreach for insert to authenticated with check (true);
create policy "Authenticated can update job_outreach"
  on public.job_outreach for update to authenticated using (true) with check (true);
create policy "Authenticated can delete job_outreach"
  on public.job_outreach for delete to authenticated using (true);

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
  invite_activity as (
    select sent_at, status
    from public.outreach
    where kind = 'invite'
    union all
    select sent_at, status
    from public.job_outreach
    where kind = 'invite'
  ),
  counts as (
    select
      count(*) filter (
        where sent_at >= date_trunc('day', now() at time zone 'utc')
      )::int as sent_today,
      count(*) filter (
        where sent_at >= now() - interval '7 days'
      )::int as sent_7d
    from invite_activity
    where sent_at is not null
      and status in ('pending', 'accepted', 'sent', 'ignored')
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
