import type { InviteCapacity, Temperature } from "@/types/crm";

export const DAILY_INVITE_CAP = 10;
export const WEEKLY_INVITE_CAP = 80;
/** LinkedIn blocks re-invites after withdraw for ~3 weeks. */
export const REINVITE_COOLDOWN_DAYS = 21;
/** Pending invites older than this should be withdrawn. */
export const PENDING_STALE_DAYS = 21;

const TEMP_RANK: Record<string, number> = {
  HOT: 0,
  GOOD: 1,
  MAYBE: 2,
  IGNORE: 3,
};

export function emptyCapacity(): InviteCapacity {
  return {
    sent_today: 0,
    sent_7d: 0,
    daily_cap: DAILY_INVITE_CAP,
    weekly_cap: WEEKLY_INVITE_CAP,
    remaining_today: DAILY_INVITE_CAP,
    remaining_week: WEEKLY_INVITE_CAP,
  };
}

export function normalizeCapacity(raw: unknown): InviteCapacity {
  if (!raw || typeof raw !== "object") return emptyCapacity();
  const o = raw as Record<string, unknown>;
  const sent_today = Number(o.sent_today) || 0;
  const sent_7d = Number(o.sent_7d) || 0;
  const daily_cap = Number(o.daily_cap) || DAILY_INVITE_CAP;
  const weekly_cap = Number(o.weekly_cap) || WEEKLY_INVITE_CAP;
  const remaining_today =
    typeof o.remaining_today === "number"
      ? o.remaining_today
      : Math.max(0, daily_cap - sent_today);
  const remaining_week =
    typeof o.remaining_week === "number"
      ? o.remaining_week
      : Math.max(0, weekly_cap - sent_7d);
  return {
    sent_today,
    sent_7d,
    daily_cap,
    weekly_cap,
    remaining_today,
    remaining_week,
  };
}

export function batchSlotsAvailable(capacity: InviteCapacity): number {
  return Math.min(capacity.remaining_today, capacity.remaining_week);
}

export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
}

export function isStalePending(sentAt: string | null | undefined): boolean {
  const days = daysSince(sentAt);
  return days !== null && days >= PENDING_STALE_DAYS;
}

export type QueueCandidate = {
  contact_id: string;
  company_id: string;
  contact_name: string;
  linkedin_url: string | null;
  is_primary: boolean;
  linkedin_verified: boolean;
  company_name: string;
  score: number;
  temperature: Temperature | string | null;
};

/**
 * Sort candidates: score desc, temperature HOT→IGNORE, primary contact first.
 */
export function sortQueueCandidates(rows: QueueCandidate[]): QueueCandidate[] {
  return [...rows].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ta = TEMP_RANK[a.temperature || ""] ?? 9;
    const tb = TEMP_RANK[b.temperature || ""] ?? 9;
    if (ta !== tb) return ta - tb;
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.contact_name.localeCompare(b.contact_name);
  });
}

export type ExistingInviteRow = {
  contact_id: string | null;
  company_id: string;
  status: string;
  created_at: string;
  sent_at: string | null;
};

/**
 * Filter out contacts that already have a recent invite, or companies that
 * already have a pending/accepted invite on any contact.
 */
export function filterEligibleCandidates(
  candidates: QueueCandidate[],
  existingInvites: ExistingInviteRow[],
  cooldownDays = REINVITE_COOLDOWN_DAYS
): QueueCandidate[] {
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const blockedContacts = new Set<string>();
  const blockedCompanies = new Set<string>();

  for (const inv of existingInvites) {
    if (inv.status === "queued" || inv.status === "pending" || inv.status === "accepted") {
      blockedCompanies.add(inv.company_id);
      if (inv.contact_id) blockedContacts.add(inv.contact_id);
      continue;
    }
    // Cooldown for any invite activity in the last N days
    const ref = inv.sent_at || inv.created_at;
    const t = new Date(ref).getTime();
    if (Number.isFinite(t) && now - t < cooldownMs) {
      if (inv.contact_id) blockedContacts.add(inv.contact_id);
    }
  }

  return candidates.filter(
    (c) =>
      !!c.linkedin_url &&
      !blockedContacts.has(c.contact_id) &&
      !blockedCompanies.has(c.company_id)
  );
}

export function pickDailyBatch(
  candidates: QueueCandidate[],
  existingInvites: ExistingInviteRow[],
  capacity: InviteCapacity
): QueueCandidate[] {
  const slots = batchSlotsAvailable(capacity);
  if (slots <= 0) return [];
  const eligible = filterEligibleCandidates(candidates, existingInvites);
  return sortQueueCandidates(eligible).slice(0, slots);
}
