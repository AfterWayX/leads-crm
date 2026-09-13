"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateJobStageAction } from "@/app/(app)/jobs/actions";
import { JOB_STAGES, JOB_STAGE_LABELS, type JobStage } from "@/types/crm";

export function JobStageButtons({
  id,
  current,
}: {
  id: string;
  current: string;
}) {
  const [pending, startTransition] = useTransition();
  const next = JOB_STAGES.filter((s) => s !== current);

  return (
    <div className="flex flex-wrap gap-2">
      {next.map((stage) => (
        <Button
          key={stage}
          type="button"
          size="sm"
          variant={stage === "applied" ? "default" : "outline"}
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await updateJobStageAction(id, stage as JobStage);
            });
          }}
        >
          → {JOB_STAGE_LABELS[stage]}
        </Button>
      ))}
    </div>
  );
}
