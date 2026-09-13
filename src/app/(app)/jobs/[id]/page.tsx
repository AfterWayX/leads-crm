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
  type JobApplication,
  type JobStage,
} from "@/types/crm";
import { APPLY_QUEUE_LABELS, type ApplyQueueStatus } from "@/lib/auto-apply";

type Params = Promise<{ id: string }>;

export default async function JobDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) notFound();
  const job = data as JobApplication;

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
