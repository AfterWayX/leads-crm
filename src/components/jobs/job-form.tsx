"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  JOB_PRIORITIES,
  JOB_REGIONS,
  JOB_STAGES,
  JOB_STAGE_LABELS,
  type JobApplication,
} from "@/types/crm";

type Props = {
  job?: JobApplication;
  action: (formData: FormData) => Promise<{ error?: string; ok?: boolean } | void>;
  submitLabel?: string;
};

export function JobForm({ job, action, submitLabel = "Save" }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-6"
      action={(fd) => {
        startTransition(async () => {
          await action(fd);
        });
      }}
    >
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="company_name">Company *</Label>
          <Input
            id="company_name"
            name="company_name"
            required
            defaultValue={job?.company_name || ""}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Role title *</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={job?.title || ""}
            placeholder="Senior Full-Stack Engineer"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="apply_url">Apply URL</Label>
          <Input
            id="apply_url"
            name="apply_url"
            type="url"
            defaultValue={job?.apply_url || ""}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Input
            id="source"
            name="source"
            defaultValue={job?.source || ""}
            placeholder="WithMira, LinkedIn, …"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <select
            id="region"
            name="region"
            defaultValue={job?.region || ""}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="">—</option>
            {JOB_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="salary_min_usd">Salary min (USD/mo)</Label>
          <Input
            id="salary_min_usd"
            name="salary_min_usd"
            type="number"
            defaultValue={job?.salary_min_usd ?? ""}
            placeholder="3500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salary_max_usd">Salary max (USD/mo)</Label>
          <Input
            id="salary_max_usd"
            name="salary_max_usd"
            type="number"
            defaultValue={job?.salary_max_usd ?? ""}
            placeholder="6000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stage">Stage</Label>
          <select
            id="stage"
            name="stage"
            defaultValue={job?.stage || "saved"}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            {JOB_STAGES.map((s) => (
              <option key={s} value={s}>
                {JOB_STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            defaultValue={job?.priority || "B"}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            {JOB_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tech_stack">Tech stack (comma-separated)</Label>
          <Input
            id="tech_stack"
            name="tech_stack"
            defaultValue={(job?.tech_stack || []).join(", ")}
            placeholder="React, Next.js, TypeScript, NestJS"
          />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="moldova_eligible"
            name="moldova_eligible"
            type="checkbox"
            defaultChecked={job?.moldova_eligible ?? true}
            className="size-4 rounded border"
          />
          <Label htmlFor="moldova_eligible">Moldova eligible</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="applied_at">Applied at</Label>
          <Input
            id="applied_at"
            name="applied_at"
            type="date"
            defaultValue={job?.applied_at || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="follow_up_at">Follow up</Label>
          <Input
            id="follow_up_at"
            name="follow_up_at"
            type="date"
            defaultValue={job?.follow_up_at || ""}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={job?.notes || ""}
          />
        </div>
      </section>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
