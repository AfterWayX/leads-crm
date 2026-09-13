"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeJobFit } from "@/lib/jobs";

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

function parseTechStack(v: FormDataEntryValue | null): string[] {
  const s = String(v ?? "").trim();
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function jobPayloadFromForm(formData: FormData) {
  const tech_stack = parseTechStack(formData.get("tech_stack"));
  const moldova_eligible =
    formData.get("moldova_eligible") === "on" ||
    formData.get("moldova_eligible") === "true";

  const base = {
    company_name: String(formData.get("company_name") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    apply_url: emptyToNull(formData.get("apply_url")),
    source: emptyToNull(formData.get("source")),
    region: emptyToNull(formData.get("region")),
    salary_min_usd: toInt(formData.get("salary_min_usd")),
    salary_max_usd: toInt(formData.get("salary_max_usd")),
    moldova_eligible,
    tech_stack,
    stage: emptyToNull(formData.get("stage")) || "saved",
    priority: emptyToNull(formData.get("priority")) || "B",
    notes: emptyToNull(formData.get("notes")),
    applied_at: emptyToNull(formData.get("applied_at")),
    follow_up_at: emptyToNull(formData.get("follow_up_at")),
  };

  const scored = computeJobFit({
    tech_stack,
    moldova_eligible,
    region: base.region,
    salary_min_usd: base.salary_min_usd,
    title: base.title,
  });

  return {
    ...base,
    fit_score: scored.score,
    temperature: scored.temperature,
  };
}

export async function createJobApplicationAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const payload = jobPayloadFromForm(formData);
  if (!payload.company_name || !payload.title) {
    return { error: "Company and title are required" };
  }

  const { data, error } = await supabase
    .from("job_applications")
    .insert({
      ...payload,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/jobs");
  redirect(`/jobs/${data.id}`);
}

export async function updateJobApplicationAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const payload = jobPayloadFromForm(formData);
  if (!payload.company_name || !payload.title) {
    return { error: "Company and title are required" };
  }

  const { error } = await supabase
    .from("job_applications")
    .update(payload)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/jobs/${id}`);
  revalidatePath("/jobs");
  return { ok: true };
}

export async function updateJobStageAction(id: string, stage: string) {
  const supabase = await createClient();
  const patch: Record<string, unknown> = { stage };
  if (stage === "applied") {
    patch.applied_at = new Date().toISOString().slice(0, 10);
    const follow = new Date();
    follow.setDate(follow.getDate() + 7);
    patch.follow_up_at = follow.toISOString().slice(0, 10);
  }

  const { error } = await supabase
    .from("job_applications")
    .update(patch)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  return { ok: true };
}

export async function deleteJobApplicationAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("job_applications").delete().eq("id", id);
  if (error) {
    // form actions should not return values when used as HTML form action
    throw new Error(error.message);
  }
  revalidatePath("/jobs");
  redirect("/jobs");
}
