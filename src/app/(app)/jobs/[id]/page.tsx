import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JobForm } from "@/components/jobs/job-form";
import { JobStageButtons } from "@/components/jobs/job-stage-buttons";
import { TemperatureBadge } from "@/components/companies/temperature-badge";
import { formatSalaryRange } from "@/lib/jobs";
import {
  deleteJobApplicationAction,
  updateJobApplicationAction,
} from "../actions";
import { regenerateMaterialsAction } from "../auto-apply-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  JOB_STAGE_LABELS,
  RECRUITER_STAGE_LABELS,
  type JobApplication,
  type JobContact,
  type JobOutreach,
  type JobStage,
  type RecruiterStage,
} from "@/types/crm";
import { APPLY_QUEUE_LABELS, type ApplyQueueStatus } from "@/lib/auto-apply";

type Params = Promise<{ id: string }>;

export default async function JobDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data, error }, { data: contacts }, { data: outreach }] =
    await Promise.all([
      supabase
        .from("job_applications")
        .select("*")
        .eq("id", id)
        .single(),
      supabase
        .from("job_contacts")
        .select("*")
        .eq("job_application_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("job_outreach")
        .select("*")
        .eq("job_application_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (error || !data) notFound();
  const job = data as JobApplication;
  const recruiters = (contacts || []) as JobContact[];
  const recruiterOutreach = (outreach || []) as JobOutreach[];
  const invite = recruiterOutreach.find((item) => item.kind === "invite");
  const message = recruiterOutreach.find((item) => item.kind === "message");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/jobs" className="text-sm text-zinc-500 hover:underline">
            ← Jobs
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {job.company_name}
          </h1>
          <p className="text-sm text-zinc-600">{job.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="tabular-nums font-medium">{job.fit_score}/10</span>
            <TemperatureBadge value={job.temperature} />
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs">
              Priority {job.priority}
            </span>
            <span className="text-zinc-500">
              {JOB_STAGE_LABELS[job.stage as JobStage] || job.stage}
            </span>
            <span className="text-zinc-500">
              {formatSalaryRange(job.salary_min_usd, job.salary_max_usd)}
            </span>
          </div>
        </div>
        {job.apply_url && (
          <Button asChild>
            <a href={job.apply_url} target="_blank" rel="noreferrer">
              Open apply link
            </a>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Move stage</CardTitle>
          <CardDescription>
            Marking Applied sets today&apos;s date and a +7 day follow-up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JobStageButtons id={job.id} current={String(job.stage)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recruiter outreach</CardTitle>
          <CardDescription>
            {RECRUITER_STAGE_LABELS[
              job.recruiter_stage as RecruiterStage
            ] || job.recruiter_stage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {recruiters.length > 0 ? (
            <div className="space-y-3">
              {recruiters.map((recruiter) => (
                <div key={recruiter.id}>
                  {recruiter.linkedin_url ? (
                    <a
                      href={recruiter.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {recruiter.name}
                    </a>
                  ) : (
                    <p className="font-medium">{recruiter.name}</p>
                  )}
                  {recruiter.title && (
                    <p className="text-xs text-zinc-500">{recruiter.title}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500">No recruiter added yet.</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
            <span>Invite: {invite?.status || "not created"}</span>
            <span>Message: {message?.status || "not created"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Auto-apply materials</CardTitle>
            <CardDescription>
              Mode: {job.apply_mode || "ats"} · Queue:{" "}
              {APPLY_QUEUE_LABELS[
                (job.apply_queue_status || "idle") as ApplyQueueStatus
              ]}
              {job.blocked_reason ? ` · ${job.blocked_reason}` : ""}
            </CardDescription>
          </div>
          <form action={regenerateMaterialsAction.bind(null, id)}>
            <Button type="submit" variant="outline" size="sm">
              Regenerate
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-3">
          {job.cover_letter ? (
            <pre className="whitespace-pre-wrap rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
              {job.cover_letter}
            </pre>
          ) : (
            <p className="text-sm text-zinc-500">
              No cover letter yet. Regenerate or run Prepare next batch.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit</CardTitle>
        </CardHeader>
        <CardContent>
          <JobForm
            job={job}
            action={updateJobApplicationAction.bind(null, id)}
            submitLabel="Save changes"
          />
        </CardContent>
      </Card>

      <form action={deleteJobApplicationAction.bind(null, id)}>
        <Button type="submit" variant="destructive">
          Delete job
        </Button>
      </form>
    </div>
  );
}
