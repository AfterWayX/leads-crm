-- Auto-apply infrastructure: applicant profile + job materials / apply modes

create table public.applicant_profile (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  location text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  citizenship text,
  work_authorization text,
  willing_to_relocate boolean not null default false,
  remote_only boolean not null default true,
  salary_min_usd int,
  salary_max_usd int,
  salary_currency text not null default 'USD',
  employment_types text[] not null default '{full_time,contractor,b2b}',
  preferred_regions text[] not null default '{EMEA,US}',
  years_experience int,
  headline text,
  summary text,
  cv_markdown_path text,
  cv_pdf_path text,
  answer_bank jsonb not null default '{}'::jsonb,
  daily_apply_cap int not null default 8,
  auto_apply_enabled boolean not null default true,
  skip_linkedin_easy_apply boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.applicant_profile enable row level security;

create policy "Authenticated can select applicant_profile"
  on public.applicant_profile for select to authenticated using (true);
create policy "Authenticated can insert applicant_profile"
  on public.applicant_profile for insert to authenticated with check (true);
create policy "Authenticated can update applicant_profile"
  on public.applicant_profile for update to authenticated using (true) with check (true);

create trigger applicant_profile_updated_at
  before update on public.applicant_profile
  for each row execute function public.set_updated_at();

-- Extend job applications for autonomous apply
alter table public.job_applications
  add column if not exists apply_mode text not null default 'ats',
  add column if not exists apply_queue_status text not null default 'idle',
  add column if not exists company_apply_url text,
  add column if not exists careers_email text,
  add column if not exists cover_letter text,
  add column if not exists tailored_answers jsonb not null default '{}'::jsonb,
  add column if not exists materials_ready_at timestamptz,
  add column if not exists blocked_reason text,
  add column if not exists last_apply_attempt_at timestamptz,
  add column if not exists apply_result text;

create index if not exists job_applications_queue_status_idx
  on public.job_applications(apply_queue_status);

comment on column public.job_applications.apply_mode is
  'ats | email | linkedin | manual';
comment on column public.job_applications.apply_queue_status is
  'idle | queued | materials_ready | applying | applied | blocked | skipped';

create or replace function public.auto_apply_capacity()
returns json
language plpgsql
stable
security invoker
as $$
declare
  cap int;
  used int;
begin
  select coalesce(daily_apply_cap, 8) into cap
  from public.applicant_profile
  order by created_at asc
  limit 1;

  if cap is null then
    cap := 8;
  end if;

  select count(*)::int into used
  from public.job_applications
  where stage = 'applied'
    and applied_at = current_date;

  return json_build_object(
    'daily_cap', cap,
    'applied_today', used,
    'remaining_today', greatest(cap - used, 0),
    'queued', (
      select count(*)::int from public.job_applications
      where apply_queue_status in ('queued', 'materials_ready')
    ),
    'blocked', (
      select count(*)::int from public.job_applications
      where apply_queue_status = 'blocked'
    ),
    'materials_ready', (
      select count(*)::int from public.job_applications
      where apply_queue_status = 'materials_ready'
    )
  );
end;
$$;

grant execute on function public.auto_apply_capacity() to authenticated;
