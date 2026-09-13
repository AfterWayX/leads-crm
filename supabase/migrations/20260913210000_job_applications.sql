-- Job applications tracker (personal job hunt — separate from B2B leads funnel)
create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  title text not null,
  apply_url text,
  source text,
  region text,
  salary_min_usd int,
  salary_max_usd int,
  moldova_eligible boolean not null default true,
  tech_stack text[] not null default '{}',
  fit_score int not null default 0,
  temperature text not null default 'MAYBE',
  stage text not null default 'saved',
  priority text not null default 'B',
  notes text,
  applied_at date,
  follow_up_at date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_applications_stage_idx on public.job_applications(stage);
create index job_applications_fit_score_idx on public.job_applications(fit_score desc);
create index job_applications_temperature_idx on public.job_applications(temperature);
create index job_applications_follow_up_idx on public.job_applications(follow_up_at);

alter table public.job_applications enable row level security;

create policy "Authenticated can select job_applications"
  on public.job_applications for select to authenticated using (true);
create policy "Authenticated can insert job_applications"
  on public.job_applications for insert to authenticated with check (true);
create policy "Authenticated can update job_applications"
  on public.job_applications for update to authenticated using (true) with check (true);
create policy "Authenticated can delete job_applications"
  on public.job_applications for delete to authenticated using (true);

create trigger job_applications_updated_at
  before update on public.job_applications
  for each row execute function public.set_updated_at();

create or replace function public.job_application_stats()
returns json
language sql
stable
security invoker
as $$
  select json_build_object(
    'by_stage', (
      select coalesce(json_object_agg(stage, cnt), '{}'::json)
      from (
        select stage, count(*)::int as cnt from public.job_applications group by stage
      ) s
    ),
    'by_temperature', (
      select coalesce(json_object_agg(temperature, cnt), '{}'::json)
      from (
        select temperature, count(*)::int as cnt from public.job_applications group by temperature
      ) t
    ),
    'total', (select count(*)::int from public.job_applications),
    'hot_or_good', (
      select count(*)::int from public.job_applications where temperature in ('HOT', 'GOOD')
    ),
    'applied_count', (
      select count(*)::int from public.job_applications
      where stage not in ('saved', 'rejected', 'withdrawn')
    ),
    'follow_ups_due', (
      select count(*)::int from public.job_applications
      where follow_up_at is not null
        and follow_up_at <= current_date
        and stage not in ('offer', 'rejected', 'withdrawn')
    )
  );
$$;

grant execute on function public.job_application_stats() to authenticated;
