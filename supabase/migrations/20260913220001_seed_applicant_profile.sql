-- Seed David Beregoi applicant profile for autonomous apply

insert into public.applicant_profile (
  full_name,
  email,
  phone,
  location,
  linkedin_url,
  github_url,
  portfolio_url,
  citizenship,
  work_authorization,
  willing_to_relocate,
  remote_only,
  salary_min_usd,
  salary_max_usd,
  employment_types,
  preferred_regions,
  years_experience,
  headline,
  summary,
  cv_markdown_path,
  cv_pdf_path,
  answer_bank,
  daily_apply_cap,
  auto_apply_enabled,
  skip_linkedin_easy_apply
)
select
  'David Beregoi',
  'afterwayx@gmail.com',
  '+373 62015030',
  'Chișinău, Moldova',
  null,
  'https://github.com/AfterWayX',
  'https://afterwayx.com',
  'Moldovan',
  'Moldovan citizen. Available for full-remote B2B/contractor or EOR employment. No US/EU work authorization required for remote contractor engagements.',
  false,
  true,
  3500,
  7000,
  array['full_time','contractor','b2b'],
  array['EMEA','US'],
  5,
  'Senior Full-Stack Engineer | React · Next.js · TypeScript · Node.js · NestJS | Remote (EMEA/US)',
  'Senior Full-Stack Engineer with 5+ years building SaaS platforms, large-scale data systems, AI-powered applications, and production AWS infrastructure. Specialized in React, Next.js, TypeScript, Node.js, and NestJS. Delivered search over 100M+ records and enterprise B2B logistics platforms.',
  'docs/job-hunt/David_Beregoi_CV.md',
  'docs/job-hunt/David_Beregoi_CV.pdf',
  jsonb_build_object(
    'years_experience', '5+',
    'notice_period', '2 weeks',
    'start_date', 'Immediately / within 2 weeks',
    'english_level', 'Professional / Advanced',
    'timezone', 'EET/EEST (UTC+2/+3), overlap with EMEA full day and partial US hours',
    'remote_preference', 'Fully remote only',
    'visa_sponsorship', 'Not needed for remote contractor/B2B; cannot relocate without sponsorship discussion',
    'salary_expectation_emea', '4500-6000 USD/month B2B (floor 3500)',
    'salary_expectation_us', '5000-7000 USD/month contractor (floor 4000)',
    'highest_education', 'See CV / available on request',
    'authorized_to_work_us', 'No — applying as international remote contractor',
    'authorized_to_work_eu', 'No EU citizenship — Moldova-based remote contractor',
    'require_sponsorship', 'No for remote B2B; yes only if onsite EU/US employment',
    'comfortable_async', 'Yes — strong async written communication',
    'stack_strengths', 'React, Next.js, TypeScript, Node.js, NestJS, PostgreSQL, Redis, Elasticsearch, AWS, Docker, CI/CD',
    'why_company_template', 'I am excited about {company} because it matches my experience in {hook}. I can contribute immediately with React/Next.js/TypeScript and Node/NestJS, plus production ownership on AWS.',
    'linkedin_easy_apply_policy', 'Do not auto-submit LinkedIn Easy Apply. Prefer company ATS or email.'
  ),
  8,
  true,
  true
where not exists (select 1 from public.applicant_profile limit 1);

-- Prefer external ATS / email modes for Priority A roles (skip LinkedIn automation)
update public.job_applications
set apply_mode = case
  when company_name in ('WithMira Alert', 'Remote Rocketship') then 'manual'
  when source = 'BuiltIn' then 'ats'
  when apply_url ilike '%withmira%' then 'ats'
  when apply_url ilike '%lemon%' then 'ats'
  else 'ats'
end
where apply_queue_status = 'idle';
