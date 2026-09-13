"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatFunding } from "@/lib/format";
import {
  emptyCapacity,
  normalizeCapacity,
  pickDailyBatch,
  type ExistingInviteRow,
  type QueueCandidate,
} from "@/lib/invites";
import { generateLinkedInDm } from "@/lib/templates";
import type { InviteCapacity } from "@/types/crm";

function revalidateToday(companyId?: string) {
  revalidatePath("/today");
  revalidatePath("/outreach");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  if (companyId) revalidatePath(`/companies/${companyId}`);
}

export async function getInviteCapacity(): Promise<InviteCapacity> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("invite_capacity");
  if (error) return emptyCapacity();
  return normalizeCapacity(data);
}

export async function buildDailyBatchAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const capacity = await getInviteCapacity();
  const slots = Math.min(capacity.remaining_today, capacity.remaining_week);
  if (slots <= 0) {
    return { error: "Daily or weekly invite capacity reached.", queued: 0 };
  }

  const [{ data: contacts }, { data: invites }] = await Promise.all([
    supabase
      .from("contacts")
      .select(
        "id, company_id, name, linkedin_url, is_primary, linkedin_verified, companies(id, name, score, temperature)"
      )
      .not("linkedin_url", "is", null),
    supabase
      .from("outreach")
      .select("contact_id, company_id, status, created_at, sent_at")
      .eq("kind", "invite"),
  ]);

  const candidates: QueueCandidate[] = (contacts || [])
    .map((row) => {
      const company = Array.isArray(row.companies)
        ? row.companies[0]
        : row.companies;
      if (!company) return null;
      return {
        contact_id: row.id as string,
        company_id: row.company_id as string,
        contact_name: row.name as string,
        linkedin_url: (row.linkedin_url as string | null) || null,
        is_primary: Boolean(row.is_primary),
        linkedin_verified: Boolean(row.linkedin_verified),
        company_name: company.name as string,
        score: Number(company.score) || 0,
        temperature: (company.temperature as string | null) || null,
      };
    })
    .filter((x): x is QueueCandidate => !!x);

  const existing = (invites || []) as ExistingInviteRow[];
  const batch = pickDailyBatch(candidates, existing, capacity);

  if (batch.length === 0) {
    return {
      ok: true,
      queued: 0,
      message: "No eligible contacts left to queue.",
    };
  }

  const rows = batch.map((c) => ({
    company_id: c.company_id,
    contact_id: c.contact_id,
    channel: "linkedin",
    kind: "invite",
    status: "queued",
    subject: `LinkedIn invite — ${c.contact_name}`,
    body: "Queued for today's Daily 10. Send without a note.",
    created_by: user.id,
  }));

  const { error } = await supabase.from("outreach").insert(rows);
  if (error) return { error: error.message, queued: 0 };

  revalidateToday();
  return { ok: true, queued: rows.length };
}

export async function markInviteSentAction(id: string, companyId: string) {
  const supabase = await createClient();
  const capacity = await getInviteCapacity();
  if (batchSlotsLeft(capacity) <= 0) {
    return { error: "Invite capacity reached for today or this week." };
  }

  const { error } = await supabase
    .from("outreach")
    .update({
      status: "pending",
      sent_at: new Date().toISOString(),
      kind: "invite",
    })
    .eq("id", id)
    .eq("kind", "invite");

  if (error) return { error: error.message };

  await supabase
    .from("companies")
    .update({ stage: "contacted" })
    .eq("id", companyId)
    .in("stage", ["found", "qualified"]);

  revalidateToday(companyId);
  return { ok: true };
}

function batchSlotsLeft(capacity: InviteCapacity) {
  return Math.min(capacity.remaining_today, capacity.remaining_week);
}

export async function markInviteAcceptedAction(
  id: string,
  companyId: string,
  contactId: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("outreach")
    .update({ status: "accepted", kind: "invite" })
    .eq("id", id)
    .eq("kind", "invite");

  if (error) return { error: error.message };

  // Generate short DM draft if none exists yet for this contact
  if (contactId) {
    const { data: existing } = await supabase
      .from("outreach")
      .select("id")
      .eq("kind", "message")
      .eq("contact_id", contactId)
      .in("status", ["draft", "approved", "sent"])
      .limit(1);

    if (!existing?.length) {
      const [{ data: contact }, { data: company }] = await Promise.all([
        supabase
          .from("contacts")
          .select("name")
          .eq("id", contactId)
          .single(),
        supabase
          .from("companies")
          .select(
            "name, funding_amount_eur, funding_round, hiring_roles, offer_type, trigger_type"
          )
          .eq("id", companyId)
          .single(),
      ]);

      if (contact && company) {
        const dm = generateLinkedInDm({
          name: contact.name,
          company: company.name,
          funding:
            formatFunding(
              company.funding_amount_eur,
              company.funding_round
            ) !== "—"
              ? formatFunding(
                  company.funding_amount_eur,
                  company.funding_round
                )
              : undefined,
          roles: company.hiring_roles || undefined,
          offer: company.offer_type,
          trigger: company.trigger_type,
        });

        await supabase.from("outreach").insert({
          company_id: companyId,
          contact_id: contactId,
          channel: "linkedin",
          kind: "message",
          status: "draft",
          subject: dm.subject,
          body: dm.body,
          created_by: user.id,
        });
      }
    }
  }

  revalidateToday(companyId);
  return { ok: true };
}

export async function markInviteIgnoredAction(id: string, companyId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("outreach")
    .update({ status: "ignored", kind: "invite" })
    .eq("id", id)
    .eq("kind", "invite");

  if (error) return { error: error.message };
  revalidateToday(companyId);
  return { ok: true };
}

export async function approveMessageAction(id: string, companyId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("outreach")
    .update({ status: "approved", kind: "message" })
    .eq("id", id)
    .eq("kind", "message");

  if (error) return { error: error.message };
  revalidateToday(companyId);
  return { ok: true };
}

export async function updateMessageBodyAction(
  id: string,
  companyId: string,
  body: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("outreach")
    .update({ body, kind: "message" })
    .eq("id", id)
    .eq("kind", "message");

  if (error) return { error: error.message };
  revalidateToday(companyId);
  return { ok: true };
}

export async function markMessageSentAction(id: string, companyId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("outreach")
    .update({
      status: "sent",
      kind: "message",
      sent_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("kind", "message");

  if (error) return { error: error.message };

  await supabase
    .from("companies")
    .update({ stage: "contacted" })
    .eq("id", companyId)
    .in("stage", ["found", "qualified"]);

  revalidateToday(companyId);
  return { ok: true };
}

export async function markContactVerifiedAction(contactId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .update({ linkedin_verified: true })
    .eq("id", contactId);

  if (error) return { error: error.message };
  revalidatePath("/today");
  return { ok: true };
}
