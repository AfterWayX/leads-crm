export const FUNNEL_STAGES = [
  "found",
  "qualified",
  "invite_sent",
  "message_sent",
  "replied",
  "call",
  "opportunity",
  "proposal",
  "client",
  "lost",
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const SEGMENTS = [
  "ai_saas",
  "fintech",
  "logistics",
  "b2b_saas",
  "wildcard",
] as const;

export type Segment = (typeof SEGMENTS)[number];

export const SEGMENT_TARGETS: Record<Segment, number> = {
  ai_saas: 30,
  fintech: 20,
  logistics: 20,
  b2b_saas: 20,
  wildcard: 10,
};

export const SEGMENT_LABELS: Record<Segment, string> = {
  ai_saas: "AI / SaaS",
  fintech: "Fintech",
  logistics: "Logistics / Supply Chain",
  b2b_saas: "B2B SaaS",
  wildcard: "Wild cards",
};

export const TRIGGER_TYPES = [
  "funding",
  "hiring",
  "product_launch",
  "small_team",
] as const;

export type TriggerType = (typeof TRIGGER_TYPES)[number];

export const OFFER_TYPES = [
  "team_extension",
  "mvp",
  "ai_dev",
  "legacy_perf",
] as const;

export type OfferType = (typeof OFFER_TYPES)[number];

export const TEMPERATURES = ["HOT", "GOOD", "MAYBE", "IGNORE"] as const;
export type Temperature = (typeof TEMPERATURES)[number];

export const OUTREACH_CHANNELS = ["linkedin", "email", "call"] as const;
export type OutreachChannel = (typeof OUTREACH_CHANNELS)[number];

export const OUTREACH_KINDS = ["invite", "message"] as const;
export type OutreachKind = (typeof OUTREACH_KINDS)[number];

/** Invite lifecycle: queued → pending → accepted | ignored */
export const INVITE_STATUSES = [
  "queued",
  "pending",
  "accepted",
  "ignored",
] as const;

/** Message lifecycle: draft → approved → sent → replied | bounced */
export const MESSAGE_STATUSES = [
  "draft",
  "approved",
  "sent",
  "replied",
  "bounced",
] as const;

export const OUTREACH_STATUSES = [
  ...INVITE_STATUSES,
  ...MESSAGE_STATUSES,
] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export type InviteCapacity = {
  sent_today: number;
  sent_7d: number;
  daily_cap: number;
  weekly_cap: number;
  remaining_today: number;
  remaining_week: number;
};

export const SOURCES = [
  "Dealroom",
  "Crunchbase",
  "Sifted",
  "LinkedIn",
  "Other",
] as const;

export type ScoreBreakdown = {
  recent_funding: number;
  hiring_devs: number;
  employee_range: number;
  saas_ai_product: number;
  founder_identified: number;
  stack_match: number;
};

export type Company = {
  id: string;
  name: string;
  country: string | null;
  industry: string | null;
  segment: Segment | string | null;
  website: string | null;
  linkedin_url: string | null;
  careers_url: string | null;
  funding_amount_eur: number | null;
  funding_round: string | null;
  funding_date: string | null;
  employees: number | null;
  tech_stack: string[] | null;
  hiring: boolean | null;
  hiring_roles: string | null;
  hiring_count: number | null;
  trigger_type: TriggerType | string | null;
  offer_type: OfferType | string | null;
  source: string | null;
  score: number;
  score_breakdown: ScoreBreakdown | Record<string, number> | null;
  temperature: Temperature | string | null;
  stage: FunnelStage | string;
  reason: string | null;
  notes: string | null;
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
  company_id: string;
  name: string;
  title: string | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  linkedin_verified: boolean;
  created_at: string;
};

export type Outreach = {
  id: string;
  company_id: string;
  contact_id: string | null;
  channel: OutreachChannel | string;
  kind: OutreachKind | string;
  status: OutreachStatus | string;
  subject: string | null;
  body: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  replied_at: string | null;
  follow_up_at: string | null;
  response_notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type DashboardStats = {
  by_stage: Record<string, number>;
  by_temperature: Record<string, number>;
  by_segment: Record<string, number>;
  total: number;
  hot_or_good: number;
};

/** Personal job-hunt tracker (separate from B2B leads funnel) */
export const JOB_STAGES = [
  "saved",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export type JobStage = (typeof JOB_STAGES)[number];

export const JOB_STAGE_LABELS: Record<JobStage, string> = {
  saved: "Saved",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const JOB_PRIORITIES = ["A", "B", "C"] as const;
export type JobPriority = (typeof JOB_PRIORITIES)[number];

export const JOB_REGIONS = ["EMEA", "US", "EMEA/US", "Worldwide"] as const;

export type JobApplication = {
  id: string;
  company_name: string;
  title: string;
  apply_url: string | null;
  source: string | null;
  region: string | null;
  salary_min_usd: number | null;
  salary_max_usd: number | null;
  moldova_eligible: boolean;
  tech_stack: string[] | null;
  fit_score: number;
  temperature: Temperature | string | null;
  stage: JobStage | string;
  recruiter_stage: RecruiterStage | string;
  priority: JobPriority | string;
  notes: string | null;
  applied_at: string | null;
  follow_up_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  apply_mode?: string | null;
  apply_queue_status?: string | null;
  company_apply_url?: string | null;
  careers_email?: string | null;
  cover_letter?: string | null;
  tailored_answers?: Record<string, string> | null;
  materials_ready_at?: string | null;
  blocked_reason?: string | null;
  last_apply_attempt_at?: string | null;
  apply_result?: string | null;
};

export const RECRUITER_STAGES = [
  "to_find",
  "recruiter_found",
  "invite_sent",
  "accepted",
  "message_sent",
  "replied",
  "no_recruiter",
] as const;

export type RecruiterStage = (typeof RECRUITER_STAGES)[number];

export const RECRUITER_STAGE_LABELS: Record<RecruiterStage, string> = {
  to_find: "To find",
  recruiter_found: "Recruiter found",
  invite_sent: "Invite sent",
  accepted: "Accepted",
  message_sent: "Message sent",
  replied: "Replied",
  no_recruiter: "No recruiter",
};

export type JobContact = {
  id: string;
  job_application_id: string;
  name: string;
  title: string | null;
  linkedin_url: string | null;
  email: string | null;
  linkedin_verified: boolean;
  created_at: string;
};

export type JobOutreach = {
  id: string;
  job_application_id: string;
  job_contact_id: string | null;
  channel: OutreachChannel | string;
  kind: OutreachKind | string;
  status: OutreachStatus | string;
  subject: string | null;
  body: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  replied_at: string | null;
  follow_up_at: string | null;
  response_notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type JobApplicationStats = {
  by_stage: Record<string, number>;
  by_temperature: Record<string, number>;
  total: number;
  hot_or_good: number;
  applied_count: number;
  follow_ups_due: number;
};
