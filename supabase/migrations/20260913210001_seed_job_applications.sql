-- Seed curated Moldova-eligible / strong-fit remote roles for David's job hunt
-- Safe to re-run: skips duplicates by (company_name, title)

insert into public.job_applications (
  company_name, title, apply_url, source, region,
  salary_min_usd, salary_max_usd, moldova_eligible, tech_stack,
  fit_score, temperature, stage, priority, notes
)
select
  v.company_name,
  v.title,
  v.apply_url,
  v.source,
  v.region,
  v.salary_min_usd,
  v.salary_max_usd,
  v.moldova_eligible,
  v.tech_stack,
  v.fit_score,
  v.temperature,
  v.stage,
  v.priority,
  v.notes
from (
  select
    'Huzzle'::text as company_name,
    'Senior Fullstack Engineer — TypeScript / Next.js / Supabase'::text as title,
    'https://withmira.dev/jobs/huzzle-senior-fullstack-engineer-typescript-next-js-supabase'::text as apply_url,
    'WithMira'::text as source,
    'EMEA'::text as region,
    3500::int as salary_min_usd,
    6000::int as salary_max_usd,
    true as moldova_eligible,
    array['Next.js','TypeScript','PostgreSQL','Supabase','React','Node.js']::text[] as tech_stack,
    10::int as fit_score,
    'HOT'::text as temperature,
    'saved'::text as stage,
    'A'::text as priority,
    'Exact stack match. Moldova in accepted countries. Confirm eligibility then apply first.'::text as notes
  union all select 'Lemon.io', 'Senior React.js Full-stack Developer',
    'https://withmira.dev/jobs/lemon-io-senior-react-js-full-stack-developer', 'WithMira', 'EMEA/US',
    4000, 7000, true, array['React','Node.js','Next.js','TypeScript','AWS','AI']::text[],
    9, 'HOT', 'saved', 'A', 'Network / contractor rates. Moldova in 87 countries. Strong React+Node fit.'
  union all select '3Pillar Global', 'Lead Full stack Engineer (Node.js & React Native)',
    'https://withmira.dev/jobs/react/moldova', 'WithMira', 'EMEA',
    3500, 5500, true, array['Node.js','React Native','React','Docker','CI/CD']::text[],
    8, 'HOT', 'saved', 'A', 'Explicit Moldova remote hiring. Verify salary band.'
  union all select '3Pillar Global', 'Senior Full-Stack Software Engineer (Python / React)',
    'https://withmira.dev/jobs/react/moldova', 'WithMira', 'EMEA',
    3500, 5500, true, array['React','Python','AWS','Docker','JavaScript']::text[],
    7, 'GOOD', 'saved', 'A', 'Moldova remote. Pitch NestJS/Node as primary backend; Python is secondary.'
  union all select 'Unframe', 'Full Stack Software Engineer (Remote)',
    'https://withmira.dev/jobs/react/moldova', 'WithMira', 'EMEA/US',
    4000, 7000, true, array['JavaScript','Node.js','PostgreSQL','AI']::text[],
    9, 'HOT', 'saved', 'A', 'AI-powered apps + Node/Postgres — matches Corlabtech + AI tooling.'
  union all select 'LaunchDarkly', 'Senior Full Stack Engineer, Enterprise Feature Management',
    'https://withmira.dev/jobs/react/moldova', 'WithMira', 'US/EMEA',
    5000, 9000, true, array['React','TypeScript']::text[],
    8, 'HOT', 'saved', 'A', 'End-to-end ownership. Confirm Moldova still listed before applying.'
  union all select 'Affirm', 'Senior Software Engineer, Fullstack (International)',
    'https://withmira.dev/jobs/react/moldova', 'WithMira', 'US',
    5000, 10000, true, array['React','Python','AWS','Kubernetes']::text[],
    8, 'HOT', 'saved', 'A', 'US fintech international track. Moldova-eligible on WithMira. Aim $5k+.'
  union all select 'Affirm', 'Software Engineer II, Fullstack (International)',
    'https://withmira.dev/jobs/react/moldova', 'WithMira', 'US',
    4500, 8000, true, array['Python','React','REST']::text[],
    7, 'GOOD', 'saved', 'A', 'Backup Affirm track if Senior feels steep.'
  union all select 'Codekeeper', 'Frontend Developer (React)',
    'https://withmira.dev/jobs/react/moldova', 'WithMira', 'EMEA',
    3500, 5500, true, array['React','JavaScript','AWS','GraphQL']::text[],
    7, 'GOOD', 'saved', 'A', 'Senior React FE. Moldova-eligible.'
  union all select 'RoClub', 'Senior Frontend Developer — React, Next.js & TypeScript',
    'https://withmira.dev/jobs/roclub-senior-frontend-developer-m-w-d-react-next-js-typescript', 'WithMira', 'EMEA',
    3500, 5500, true, array['React','Next.js','TypeScript','Tailwind','Docker']::text[],
    8, 'HOT', 'saved', 'A', 'Next/TS/Tailwind. Moldova in 38 countries.'
  union all select 'MWDN', 'Full-Stack Software Engineer (Remote Moldova)',
    'https://builtin.com/job/full-stack-software-engineer/10869372', 'BuiltIn', 'EMEA',
    3500, 5500, true, array['React','TypeScript','Node.js','PostgreSQL','AWS','Docker']::text[],
    9, 'HOT', 'saved', 'A', 'Hiring remotely IN Moldova. Healthcare platform. Strong apply.'
  union all select 'Human Power BG', 'Full-Stack Node.js & React Developer',
    'https://withmira.dev/jobs/react/moldova', 'WithMira', 'EMEA',
    3500, 5000, true, array['React','TypeScript','Node.js','GraphQL','AWS']::text[],
    7, 'GOOD', 'saved', 'A', 'React/TS + Node. Confirm mid vs senior band and salary.'
  union all select 'Consensys / MetaMask', 'Senior Software Engineer: Social & AI',
    'https://withmira.dev/jobs/react/moldova', 'WithMira', 'US/EMEA',
    5000, 10000, true, array['JavaScript','React','TypeScript']::text[],
    6, 'GOOD', 'saved', 'B', 'Stretch — crypto domain. Moldova-eligible.'
  union all select 'Sprout Social', 'Staff Software Engineer, Web (React)',
    'https://withmira.dev/jobs/react/moldova', 'WithMira', 'US',
    6000, 11000, true, array['JavaScript','Node.js','React','TypeScript']::text[],
    6, 'GOOD', 'saved', 'B', 'Staff title = stretch. Apply if Senior Affirm/LD go cold.'
  union all select 'Canonical', 'Web Developer',
    'https://withmira.dev/jobs/react/moldova', 'WithMira', 'EMEA',
    3500, 6000, true, array['JavaScript','Python','React']::text[],
    6, 'MAYBE', 'saved', 'B', 'Broad eligibility. Competitive hiring process.'
  union all select 'Samsara', 'Senior SWE — Agentic Platform & Integrations (Full Stack)',
    'https://withmira.dev/jobs/countries/moldova', 'WithMira', 'US',
    5000, 10000, true, array['GraphQL','REST','AI']::text[],
    7, 'GOOD', 'saved', 'B', 'AI/agentic angle matches your tooling + Corlabtech.'
  union all select 'Alvys', 'Senior Full Stack Engineer',
    'https://hiretik.com/jobs/country/moldova', 'Hiretik', 'US/EMEA',
    4000, 7000, true, array['Full-stack','Logistics']::text[],
    9, 'HOT', 'saved', 'A', 'Freight/logistics domain match. Verify remote vs hybrid Chișinău.'
  union all select 'Lemon.io', 'Senior React Native Developer',
    'https://withmira.dev/jobs/react/moldova', 'WithMira', 'EMEA/US',
    4000, 7000, true, array['React Native','React','Node.js']::text[],
    6, 'MAYBE', 'saved', 'B', 'Secondary track — you list RN on CV.'
  union all select 'WithMira Alert', 'Moldova + React weekly digest',
    'https://withmira.dev/jobs/react/moldova', 'WithMira', 'EMEA/US',
    null::int, null::int, true, array['React']::text[],
    5, 'MAYBE', 'saved', 'C', 'Save email alert on WithMira — not a job, a pipeline.'
  union all select 'Remote Rocketship', 'Moldova software engineer board',
    'https://www.remoterocketship.com/country/moldova/jobs/software-engineer/', 'RemoteRocketship', 'EMEA/US',
    3500, null::int, true, array['Software Engineer']::text[],
    5, 'MAYBE', 'saved', 'C', 'Browse board weekly; add individual roles as new job_applications.'
) v
where not exists (
  select 1 from public.job_applications j
  where j.company_name = v.company_name and j.title = v.title
);
