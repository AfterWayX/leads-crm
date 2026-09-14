"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeScore } from "@/lib/scoring";

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

function toInt(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toNum(v: FormDataEntryValue | null): number | null {
  return toInt(v);
}

function parseTechStack(v: FormDataEntryValue | null): string[] {
  const s = String(v ?? "").trim();
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function companyPayloadFromForm(formData: FormData) {
  const tech_stack = parseTechStack(formData.get("tech_stack"));
  const hiring = formData.get("hiring") === "on" || formData.get("hiring") === "true";
  const has_founder = formData.get("has_founder_contact") === "on";

  const base = {
    name: String(formData.get("name") || "").trim(),
    country: emptyToNull(formData.get("country")),
    industry: emptyToNull(formData.get("industry")),
    segment: emptyToNull(formData.get("segment")),
    website: emptyToNull(formData.get("website")),
    linkedin_url: emptyToNull(formData.get("linkedin_url")),
    careers_url: emptyToNull(formData.get("careers_url")),
    funding_amount_eur: toNum(formData.get("funding_amount_eur")),
    funding_round: emptyToNull(formData.get("funding_round")),
    funding_date: emptyToNull(formData.get("funding_date")),
    employees: toInt(formData.get("employees")),
    tech_stack,
    hiring,
    hiring_roles: emptyToNull(formData.get("hiring_roles")),
    hiring_count: toInt(formData.get("hiring_count")),
    trigger_type: emptyToNull(formData.get("trigger_type")),
    offer_type: emptyToNull(formData.get("offer_type")),
    source: emptyToNull(formData.get("source")),
    stage: emptyToNull(formData.get("stage")) || "found",
    reason: emptyToNull(formData.get("reason")),
    notes: emptyToNull(formData.get("notes")),
  };

  const scored = computeScore({
    funding_date: base.funding_date,
    hiring: base.hiring,
    hiring_count: base.hiring_count,
    employees: base.employees,
    segment: base.segment,
    industry: base.industry,
    has_founder_contact: has_founder,
    tech_stack: base.tech_stack,
  });

  return {
    ...base,
    score: scored.score,
    score_breakdown: scored.breakdown,
    temperature: scored.temperature,
  };
}

export async function createCompanyAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const payload = companyPayloadFromForm(formData);
  if (!payload.name) {
    return { error: "Company name is required" };
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({
      ...payload,
      created_by: user.id,
      assigned_to: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/companies");
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  redirect(`/companies/${data.id}`);
}

export async function updateCompanyAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const payload = companyPayloadFromForm(formData);
  if (!payload.name) {
    return { error: "Company name is required" };
  }

  // Preserve founder flag from contacts if checkbox not present in edit
  const { count } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("company_id", id)
    .or("title.ilike.%cto%,title.ilike.%founder%,title.ilike.%ceo%,title.ilike.%vp eng%,title.ilike.%head of eng%");

  const scored = computeScore({
    funding_date: payload.funding_date,
    hiring: payload.hiring,
    hiring_count: payload.hiring_count,
    employees: payload.employees,
    segment: payload.segment,
    industry: payload.industry,
    has_founder_contact:
      formData.get("has_founder_contact") === "on" || (count ?? 0) > 0,
    tech_stack: payload.tech_stack,
  });

  const { error } = await supabase
    .from("companies")
    .update({
      ...payload,
      score: scored.score,
      score_breakdown: scored.breakdown,
      temperature: scored.temperature,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/companies/${id}`);
  revalidatePath("/companies");
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  return { ok: true };
}

export async function recalculateScoreAction(id: string) {
  const supabase = await createClient();
  const { data: company, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !company) return { error: error?.message || "Not found" };

  const { count } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("company_id", id)
    .or(
      "title.ilike.%cto%,title.ilike.%founder%,title.ilike.%ceo%,title.ilike.%vp eng%,title.ilike.%head of eng%"
    );

  const scored = computeScore({
    funding_date: company.funding_date,
    hiring: company.hiring,
    hiring_count: company.hiring_count,
    employees: company.employees,
    segment: company.segment,
    industry: company.industry,
    has_founder_contact: (count ?? 0) > 0,
    tech_stack: company.tech_stack,
  });

  await supabase
    .from("companies")
    .update({
      score: scored.score,
      score_breakdown: scored.breakdown,
      temperature: scored.temperature,
    })
    .eq("id", id);

  revalidatePath(`/companies/${id}`);
  revalidatePath("/companies");
  revalidatePath("/dashboard");
  return { ok: true, score: scored.score, temperature: scored.temperature };
}

export async function updateCompanyStageAction(id: string, stage: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({ stage })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  revalidatePath(`/companies/${id}`);
  revalidatePath("/companies");
  return { ok: true };
}

export async function deleteCompanyAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/companies");
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  redirect("/companies");
}

export async function addContactAction(companyId: string, formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name is required" };

  const { error } = await supabase.from("contacts").insert({
    company_id: companyId,
    name,
    title: emptyToNull(formData.get("title")),
    linkedin_url: emptyToNull(formData.get("linkedin_url")),
    email: emptyToNull(formData.get("email")),
    phone: emptyToNull(formData.get("phone")),
    is_primary: formData.get("is_primary") === "on",
  });

  if (error) return { error: error.message };

  await recalculateScoreAction(companyId);
  revalidatePath(`/companies/${companyId}`);
  return { ok: true };
}

export async function deleteContactAction(companyId: string, contactId: string) {
  const supabase = await createClient();
  await supabase.from("contacts").delete().eq("id", contactId);
  await recalculateScoreAction(companyId);
  revalidatePath(`/companies/${companyId}`);
  return { ok: true };
}

export async function createOutreachDraftAction(
  companyId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("outreach").insert({
    company_id: companyId,
    contact_id: emptyToNull(formData.get("contact_id")),
    channel: emptyToNull(formData.get("channel")) || "linkedin",
    kind: "message",
    status: "draft",
    subject: emptyToNull(formData.get("subject")),
    body: emptyToNull(formData.get("body")),
    follow_up_at: emptyToNull(formData.get("follow_up_at")),
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/outreach");
  revalidatePath("/today");
  return { ok: true };
}

export async function updateOutreachStatusAction(
  id: string,
  status: string,
  companyId?: string
) {
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "pending" || status === "sent" || status === "accepted") {
    // Don't overwrite sent_at if already set for accepted
    if (status === "pending" || status === "sent") {
      patch.sent_at = new Date().toISOString();
    }
  }
  if (status === "replied") patch.replied_at = new Date().toISOString();
  if (status === "pending") patch.kind = "invite";
  if (status === "accepted") patch.kind = "invite";

  const { error } = await supabase.from("outreach").update(patch).eq("id", id);
  if (error) return { error: error.message };

  if (companyId) {
    if (status === "pending" || status === "accepted") {
      await supabase
        .from("companies")
        .update({ stage: "invite_sent" })
        .eq("id", companyId)
        .in("stage", ["found", "qualified", "contacted"]);
    }
    if (status === "sent") {
      await supabase
        .from("companies")
        .update({ stage: "message_sent" })
        .eq("id", companyId)
        .in("stage", ["found", "qualified", "contacted", "invite_sent"]);
    }
    if (status === "replied") {
      await supabase
        .from("companies")
        .update({ stage: "replied" })
        .eq("id", companyId);
    }
  }

  revalidatePath("/outreach");
  revalidatePath("/today");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  if (companyId) revalidatePath(`/companies/${companyId}`);
  return { ok: true };
}

export async function updateOutreachBodyAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("outreach")
    .update({
      subject: emptyToNull(formData.get("subject")),
      body: emptyToNull(formData.get("body")),
      follow_up_at: emptyToNull(formData.get("follow_up_at")),
      response_notes: emptyToNull(formData.get("response_notes")),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/outreach");
  return { ok: true };
}
