"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  buildTailoredAnswers,
  generateCoverLetter,
  type ApplicantProfile,
} from "@/lib/auto-apply";
import type { JobApplication } from "@/types/crm";

async function getProfile() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applicant_profile")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data as ApplicantProfile | null;
}

export async function queueHotJobsForAutoApplyAction(limit = 12) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (!profile?.auto_apply_enabled) {
    return { error: "Auto-apply disabled or profile missing" };
  }

  const { data: jobs } = await supabase
    .from("job_applications")
    .select("*")
    .eq("stage", "saved")
    .in("apply_queue_status", ["idle", "blocked"])
    .eq("moldova_eligible", true)
    .in("priority", ["A", "B"])
    .neq("apply_mode", "manual")
    .order("priority", { ascending: true })
    .order("fit_score", { ascending: false })
    .limit(limit);

  const rows = (jobs || []) as JobApplication[];
  let queued = 0;

  for (const job of rows) {
    if (
      profile.skip_linkedin_easy_apply &&
      (job.apply_mode === "linkedin" ||
        (job.apply_url || "").includes("linkedin.com"))
    ) {
      await supabase
        .from("job_applications")
        .update({
          apply_queue_status: "skipped",
          blocked_reason:
            "LinkedIn Easy Apply skipped by policy — use ATS/email path",
        })
        .eq("id", job.id);
      continue;
    }

    const cover = generateCoverLetter(profile, job);
    const answers = buildTailoredAnswers(profile, job);

    const { error } = await supabase
      .from("job_applications")
      .update({
        apply_queue_status: "materials_ready",
        cover_letter: cover,
        tailored_answers: answers,
        materials_ready_at: new Date().toISOString(),
        blocked_reason: null,
      })
      .eq("id", job.id);

    if (!error) queued += 1;
  }

  revalidatePath("/jobs");
  revalidatePath("/jobs/auto-apply");
  return { ok: true, queued };
}

/** Form-action wrapper (no return value) */
export async function prepareAutoApplyBatchAction() {
  await queueHotJobsForAutoApplyAction(12);
}

export async function regenerateMaterialsAction(id: string) {
  const supabase = await createClient();
  const profile = await getProfile();
  if (!profile) return;

  const { data: job } = await supabase
    .from("job_applications")
    .select("*")
    .eq("id", id)
    .single();
  if (!job) return;

  const cover = generateCoverLetter(profile, job as JobApplication);
  const answers = buildTailoredAnswers(profile, job as JobApplication);

  await supabase
    .from("job_applications")
    .update({
      cover_letter: cover,
      tailored_answers: answers,
      materials_ready_at: new Date().toISOString(),
      apply_queue_status:
        job.apply_queue_status === "idle" || job.apply_queue_status === "blocked"
          ? "materials_ready"
          : job.apply_queue_status,
      blocked_reason: null,
    })
    .eq("id", id);

  revalidatePath(`/jobs/${id}`);
  revalidatePath("/jobs/auto-apply");
}

export async function markJobBlockedAction(id: string, reason: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("job_applications")
    .update({
      apply_queue_status: "blocked",
      blocked_reason: reason,
      last_apply_attempt_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/jobs");
  revalidatePath("/jobs/auto-apply");
  revalidatePath(`/jobs/${id}`);
  return { ok: true };
}

export async function markJobAppliedFromEngineAction(
  id: string,
  result: string
) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const follow = new Date();
  follow.setDate(follow.getDate() + 7);

  const { error } = await supabase
    .from("job_applications")
    .update({
      stage: "applied",
      apply_queue_status: "applied",
      applied_at: today,
      follow_up_at: follow.toISOString().slice(0, 10),
      apply_result: result,
      last_apply_attempt_at: new Date().toISOString(),
      blocked_reason: null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/jobs");
  revalidatePath("/jobs/auto-apply");
  revalidatePath(`/jobs/${id}`);
  return { ok: true };
}

export async function updateApplyModeAction(id: string, mode: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("job_applications")
    .update({ apply_mode: mode })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/jobs/auto-apply");
  return { ok: true };
}
