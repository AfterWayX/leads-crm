-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'member',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Authenticated users can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Companies
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  industry text,
  segment text,
  website text,
  linkedin_url text,
  careers_url text,
  funding_amount_eur numeric,
  funding_round text,
  funding_date date,
  employees int,
  tech_stack text[] default '{}',
  hiring boolean default false,
  hiring_roles text,
  hiring_count int,
  trigger_type text,
  offer_type text,
  source text,
  score int not null default 0,
  score_breakdown jsonb default '{}'::jsonb,
  temperature text default 'IGNORE',
  stage text not null default 'found',
  reason text,
  notes text,
  created_by uuid references public.profiles(id),
  assigned_to uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index companies_stage_idx on public.companies(stage);
create index companies_score_idx on public.companies(score desc);
create index companies_segment_idx on public.companies(segment);
create index companies_temperature_idx on public.companies(temperature);

alter table public.companies enable row level security;

create policy "Authenticated can select companies"
  on public.companies for select to authenticated using (true);
create policy "Authenticated can insert companies"
  on public.companies for insert to authenticated with check (true);
create policy "Authenticated can update companies"
  on public.companies for update to authenticated using (true) with check (true);
create policy "Authenticated can delete companies"
  on public.companies for delete to authenticated using (true);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

-- Contacts
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  title text,
  linkedin_url text,
  email text,
  phone text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index contacts_company_idx on public.contacts(company_id);

alter table public.contacts enable row level security;

create policy "Authenticated can select contacts"
  on public.contacts for select to authenticated using (true);
create policy "Authenticated can insert contacts"
  on public.contacts for insert to authenticated with check (true);
create policy "Authenticated can update contacts"
  on public.contacts for update to authenticated using (true) with check (true);
create policy "Authenticated can delete contacts"
  on public.contacts for delete to authenticated using (true);

-- Outreach
create table public.outreach (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  channel text not null default 'linkedin',
  status text not null default 'draft',
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

create index outreach_company_idx on public.outreach(company_id);
create index outreach_status_idx on public.outreach(status);
create index outreach_follow_up_idx on public.outreach(follow_up_at);

alter table public.outreach enable row level security;

create policy "Authenticated can select outreach"
  on public.outreach for select to authenticated using (true);
create policy "Authenticated can insert outreach"
  on public.outreach for insert to authenticated with check (true);
create policy "Authenticated can update outreach"
  on public.outreach for update to authenticated using (true) with check (true);
create policy "Authenticated can delete outreach"
  on public.outreach for delete to authenticated using (true);

create or replace function public.funnel_stats()
returns table (
  stage text,
  count bigint
)
language sql
stable
security invoker
as $$
  select c.stage, count(*)::bigint
  from public.companies c
  group by c.stage
  order by c.stage;
$$;

grant execute on function public.funnel_stats() to authenticated;

create or replace function public.dashboard_stats()
returns json
language sql
stable
security invoker
as $$
  select json_build_object(
    'by_stage', (
      select coalesce(json_object_agg(stage, cnt), '{}'::json)
      from (
        select stage, count(*)::int as cnt from public.companies group by stage
      ) s
    ),
    'by_temperature', (
      select coalesce(json_object_agg(temperature, cnt), '{}'::json)
      from (
        select temperature, count(*)::int as cnt from public.companies group by temperature
      ) t
    ),
    'by_segment', (
      select coalesce(json_object_agg(segment, cnt), '{}'::json)
      from (
        select coalesce(segment, 'unassigned') as segment, count(*)::int as cnt
        from public.companies group by coalesce(segment, 'unassigned')
      ) g
    ),
    'total', (select count(*)::int from public.companies),
    'hot_or_good', (
      select count(*)::int from public.companies where temperature in ('HOT', 'GOOD')
    )
  );
$$;

grant execute on function public.dashboard_stats() to authenticated;
