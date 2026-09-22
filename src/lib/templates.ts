import type {
  JobApplication,
  JobContact,
  OfferType,
  TriggerType,
} from "@/types/crm";

export type PitchContext = {
  name: string;
  company: string;
  funding?: string;
  roles?: string;
  offer?: OfferType | string | null;
  trigger?: TriggerType | string | null;
  product?: string;
};

const OFFER_LINES: Record<OfferType, string> = {
  team_extension:
    "I'm running a software engineering team focused on React/Next.js, Node.js and AI-powered products. We can work as an extension of your existing team and help you ship product work while you're scaling internal hiring.",
  mvp: "We help product teams take ideas and specs to production — frontend, backend, integrations and AI features — with a focused delivery team.",
  ai_dev:
    "We specialize in LLM integrations, AI workflows, RAG and agent-style automation on top of product stacks like React/Next.js and Node.",
  legacy_perf:
    "We help product companies modernize React/Node systems — performance, architecture and delivery velocity — without freezing product work.",
};

function fundingLine(ctx: PitchContext): string {
  if (ctx.funding) {
    return `I saw that ${ctx.company} recently raised ${ctx.funding}`;
  }
  return `I've been following ${ctx.company}`;
}

function triggerOpener(ctx: PitchContext): string {
  switch (ctx.trigger) {
    case "funding":
      return `${fundingLine(ctx)}${
        ctx.roles
          ? ` and that you're currently expanding the engineering team`
          : ""
      }.`;
    case "hiring":
      return `I noticed ${ctx.company} is currently hiring across several engineering roles${
        ctx.roles ? ` (${ctx.roles})` : ""
      }.`;
    case "product_launch":
      return `I saw the recent launch of ${ctx.product || "your product"} at ${ctx.company}.`;
    case "small_team":
      return `I've been looking at ${ctx.company} and it looks like you're shipping with a lean engineering team.`;
    default:
      return `${fundingLine(ctx)}.`;
  }
}

export function generatePitch(ctx: PitchContext): {
  subject: string;
  body: string;
} {
  const offerKey = (ctx.offer as OfferType) || "team_extension";
  const offerLine =
    OFFER_LINES[offerKey] || OFFER_LINES.team_extension;

  const subject =
    ctx.trigger === "hiring"
      ? `${ctx.company} — engineering capacity while you hire`
      : ctx.trigger === "funding"
        ? `${ctx.company} — scaling engineering after your raise`
        : `${ctx.company} — engineering partnership`;

  const body = `Hi ${ctx.name || "there"},

${triggerOpener(ctx)}

${offerLine}

Given your current situation, I thought this could be relevant.

Would you be open to a short conversation?`;

  return { subject, body };
}

const DM_OFFER_LINES: Record<OfferType, string> = {
  team_extension:
    "We embed senior React/Node/AI engineers with product teams that are scaling.",
  mvp: "We help teams take specs to production: frontend, backend and AI features.",
  ai_dev:
    "I ship production React/Next.js, TypeScript and NestJS, including AI features when they fit. RAG/LLM workflows when a product actually needs them.",
  legacy_perf:
    "We modernize React/Node systems for performance without freezing product work.",
};

function dmOpener(ctx: PitchContext): string {
  switch (ctx.trigger) {
    case "funding":
      return ctx.funding
        ? `Congrats on the ${ctx.funding} raise at ${ctx.company}.`
        : `Congrats on the recent raise at ${ctx.company}.`;
    case "hiring":
      return `Noticed ${ctx.company} is hiring engineers${
        ctx.roles ? ` (${ctx.roles})` : ""
      }.`;
    case "product_launch":
      return `Saw the recent launch at ${ctx.company}. Looks sharp.`;
    case "small_team":
      return `Been following ${ctx.company}. Impressive what a lean team is shipping.`;
    default:
      return `Been following ${ctx.company}.`;
  }
}

/** Short post-accept LinkedIn DM (~400 chars). */
export function generateLinkedInDm(ctx: PitchContext): {
  subject: string;
  body: string;
} {
  const offerKey = (ctx.offer as OfferType) || "team_extension";
  const offerLine = DM_OFFER_LINES[offerKey] || DM_OFFER_LINES.team_extension;
  const first = (ctx.name || "there").split(/\s+/)[0];

  const body = `Hi ${first}, thanks for connecting.

${dmOpener(ctx)} ${offerLine}

Open to a short chat if useful?`;

  return {
    subject: `DM: ${ctx.company}`,
    body: body.slice(0, 400),
  };
}

function firstName(name: string): string {
  return (name || "there").trim().split(/\s+/)[0] || "there";
}

function truncateBelow(value: string, exclusiveLimit: number): string {
  const normalized = value.trim();
  if (normalized.length < exclusiveLimit) return normalized;

  const maxLength = exclusiveLimit - 1;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function appliedDate(job: JobApplication): string {
  if (!job.applied_at) return "recently";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${job.applied_at}T00:00:00Z`));
}

export function generateRecruiterInviteNote(
  job: JobApplication,
  contact: JobContact
): string {
  const note = `Hi ${firstName(contact.name)}, I applied for the ${job.title} role at ${job.company_name}. I'd be glad to connect and share relevant experience.`;
  return truncateBelow(note, 200);
}

export function generateRecruiterDm(
  job: JobApplication,
  contact: JobContact
): {
  subject: string;
  body: string;
} {
  const name = truncateBelow(firstName(contact.name), 40);
  const title = truncateBelow(job.title, 80);
  const company = truncateBelow(job.company_name, 60);
  const body = `Hi ${name}, I applied for the ${title} role at ${company} on ${appliedDate(job)}. My background in React, Next.js, TypeScript and Node.js looks relevant. Happy to share more context or answer questions.`;

  return {
    subject: `Application: ${job.title}`,
    body: truncateBelow(body, 400),
  };
}
