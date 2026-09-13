import type { OfferType, TriggerType } from "@/types/crm";

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
