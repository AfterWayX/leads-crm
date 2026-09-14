import type { OfferType, TriggerType } from "@/types/crm";

export const OFFER_LABELS: Record<OfferType, string> = {
  team_extension: "Engineering Team Extension",
  mvp: "MVP / Product Development",
  ai_dev: "AI Development",
  legacy_perf: "Legacy / Performance",
};

export const OFFER_DESCRIPTIONS: Record<OfferType, string> = {
  team_extension:
    "Add 1-5 experienced engineers to your existing team.",
  mvp: "Take a product from idea/specification to production.",
  ai_dev: "LLM integrations, AI workflows, RAG, AI agents, automation.",
  legacy_perf:
    "Modernize existing React/Node systems, improve performance and architecture.",
};

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  funding: "Recent funding",
  hiring: "Heavy engineering hiring",
  product_launch: "New product launch",
  small_team: "Small engineering team",
};

export const STAGE_LABELS: Record<string, string> = {
  found: "Found",
  qualified: "Qualified",
  invite_sent: "Invite sent",
  message_sent: "Message sent",
  contacted: "Contacted", // legacy — migrated to invite_sent / message_sent
  replied: "Replied",
  call: "Call",
  opportunity: "Opportunity",
  proposal: "Proposal",
  client: "Client",
  lost: "Lost",
};

export const OUTREACH_STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  pending: "Pending invite",
  accepted: "Accepted",
  ignored: "Ignored",
  draft: "Draft",
  approved: "Approved",
  sent: "Sent",
  replied: "Replied",
  bounced: "Bounced",
};

export const OUTREACH_KIND_LABELS: Record<string, string> = {
  invite: "Invite",
  message: "Message",
};
