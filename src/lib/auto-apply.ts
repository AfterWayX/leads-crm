import type { JobApplication } from "@/types/crm";

export type ApplicantProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  citizenship: string | null;
  work_authorization: string | null;
  willing_to_relocate: boolean;
  remote_only: boolean;
  salary_min_usd: number | null;
  salary_max_usd: number | null;
  salary_currency: string;
  employment_types: string[] | null;
  preferred_regions: string[] | null;
  years_experience: number | null;
  headline: string | null;
  summary: string | null;
  cv_markdown_path: string | null;
  cv_pdf_path: string | null;
  answer_bank: Record<string, string> | null;
  daily_apply_cap: number;
  auto_apply_enabled: boolean;
  skip_linkedin_easy_apply: boolean;
};

export type AutoApplyCapacity = {
  daily_cap: number;
  applied_today: number;
  remaining_today: number;
  queued: number;
  blocked: number;
  materials_ready: number;
};

export const APPLY_MODES = ["ats", "email", "linkedin", "manual"] as const;
export type ApplyMode = (typeof APPLY_MODES)[number];

export const APPLY_QUEUE_STATUSES = [
  "idle",
  "queued",
  "materials_ready",
  "applying",
  "applied",
  "blocked",
  "skipped",
] as const;
export type ApplyQueueStatus = (typeof APPLY_QUEUE_STATUSES)[number];

export const APPLY_QUEUE_LABELS: Record<ApplyQueueStatus, string> = {
  idle: "Idle",
  queued: "Queued",
  materials_ready: "Materials ready",
  applying: "Applying",
  applied: "Applied",
  blocked: "Blocked",
  skipped: "Skipped",
};

function hookForJob(job: Pick<JobApplication, "title" | "company_name" | "tech_stack" | "notes">) {
  const stack = (job.tech_stack || []).join(" ").toLowerCase();
  const title = `${job.title} ${job.notes || ""}`.toLowerCase();
  if (title.includes("logistic") || title.includes("freight") || title.includes("shipment")) {
    return "B2B logistics and real-time operational platforms";
  }
  if (stack.includes("elasticsearch") || title.includes("search") || title.includes("data")) {
    return "large-scale search and data platforms (100M+ records)";
  }
  if (stack.includes("ai") || title.includes("ai") || title.includes("agentic")) {
    return "AI-powered product surfaces and modern AI-assisted engineering";
  }
  if (stack.includes("next") || stack.includes("react")) {
    return "modern React/Next.js SaaS product engineering";
  }
  return "senior full-stack SaaS delivery with production ownership";
}

export function generateCoverLetter(
  profile: Pick<ApplicantProfile, "full_name" | "summary" | "answer_bank" | "location">,
  job: Pick<JobApplication, "company_name" | "title" | "tech_stack" | "notes" | "region">
): string {
  const hook = hookForJob(job);
  const bank = profile.answer_bank || {};
  const salaryLine =
    (job.region || "").toUpperCase().includes("US")
      ? bank.salary_expectation_us || "5000-7000 USD/month contractor"
      : bank.salary_expectation_emea || "4500-6000 USD/month B2B";

  return [
    `Dear ${job.company_name} hiring team,`,
    "",
    `I am applying for the ${job.title} role. I am a Senior Full-Stack Engineer based in ${profile.location || "Moldova"}, available fully remote.`,
    "",
    profile.summary || "",
    "",
    `I am especially interested in ${job.company_name} because it aligns with my experience in ${hook}. I can contribute immediately with React, Next.js, TypeScript, Node.js/NestJS, PostgreSQL, and AWS/CI/CD ownership.`,
    "",
    `Availability: ${bank.start_date || "within 2 weeks"}. Compensation target: ${salaryLine}. Open to B2B/contractor or EOR remote employment.`,
    "",
    "Thank you for your consideration.",
    "",
    profile.full_name,
    bank.timezone ? `Timezone: ${bank.timezone}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildTailoredAnswers(
  profile: ApplicantProfile,
  job: Pick<JobApplication, "company_name" | "title" | "region" | "tech_stack" | "notes">
): Record<string, string> {
  const bank = profile.answer_bank || {};
  const hook = hookForJob(job);
  const us = (job.region || "").toUpperCase().includes("US");

  return {
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone || "",
    location: profile.location || "",
    linkedin: profile.linkedin_url || "",
    github: profile.github_url || "",
    website: profile.portfolio_url || "",
    years_experience: String(profile.years_experience ?? bank.years_experience ?? "5"),
    notice_period: bank.notice_period || "2 weeks",
    start_date: bank.start_date || "Within 2 weeks",
    english_level: bank.english_level || "Professional",
    remote: "Yes — fully remote",
    relocate: profile.willing_to_relocate ? "Yes" : "No — remote only",
    citizenship: profile.citizenship || "Moldovan",
    work_authorization: profile.work_authorization || "",
    authorized_to_work_us: bank.authorized_to_work_us || "No — international remote contractor",
    authorized_to_work_eu: bank.authorized_to_work_eu || "No — Moldova-based remote",
    require_sponsorship: bank.require_sponsorship || "No for remote B2B",
    salary_expectation: us
      ? bank.salary_expectation_us || ""
      : bank.salary_expectation_emea || "",
    why_company: (bank.why_company_template || "")
      .replace("{company}", job.company_name)
      .replace("{hook}", hook),
    cover_summary: profile.summary || "",
  };
}
