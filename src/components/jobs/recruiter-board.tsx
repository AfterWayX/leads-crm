"use client";

import Link from "next/link";
import { useTransition } from "react";
import { updateRecruiterStageAction } from "@/app/(app)/jobs/actions";
import { LinkedInContactLink } from "@/components/companies/linkedin-contact-link";
import {
  RECRUITER_STAGE_LABELS,
  RECRUITER_STAGES,
  type JobApplication,
  type JobContact,
} from "@/types/crm";

export type RecruiterBoardJob = JobApplication & {
  job_contacts?: JobContact[] | null;
};

export function RecruiterBoard({
  jobs,
}: {
  jobs: RecruiterBoardJob[];
}) {
  const [pending, startTransition] = useTransition();
  const byStage = RECRUITER_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = jobs.filter((job) => job.recruiter_stage === stage);
      return acc;
    },
    {} as Record<string, RecruiterBoardJob[]>
  );

  function onDrop(stage: string, jobId: string) {
    startTransition(async () => {
      await updateRecruiterStageAction(jobId, stage);
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {RECRUITER_STAGES.map((stage) => (
        <div
          key={stage}
          className="flex w-64 shrink-0 flex-col rounded-lg border border-zinc-200 bg-white"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const id = event.dataTransfer.getData("text/job-id");
            if (id) onDrop(stage, id);
          }}
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
            <h2 className="text-sm font-medium">{RECRUITER_STAGE_LABELS[stage]}</h2>
            <span className="text-xs text-zinc-400">
              {byStage[stage]?.length || 0}
            </span>
          </div>
          <div
            className={`min-h-30 space-y-2 p-2 ${
              pending ? "opacity-70" : ""
            }`}
          >
            {(byStage[stage] || []).map((job) => {
              const contact = job.job_contacts?.[0];
              return (
                <div
                  key={job.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/job-id", job.id);
                  }}
                  className="cursor-grab rounded-md border border-zinc-100 bg-zinc-50 p-2 active:cursor-grabbing"
                >
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {job.company_name}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-600">{job.title}</p>
                  {contact && (
                    <div className="mt-2">
                      {contact.linkedin_url ? (
                        <LinkedInContactLink
                          name={contact.name}
                          href={contact.linkedin_url}
                          className="text-xs"
                        />
                      ) : (
                        <p className="text-xs text-zinc-500">{contact.name}</p>
                      )}
                      {contact.title && (
                        <p className="text-xs text-zinc-500">{contact.title}</p>
                      )}
                    </div>
                  )}
                  <p className="mt-2 text-xs tabular-nums text-zinc-500">
                    Fit {job.fit_score}/10
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
