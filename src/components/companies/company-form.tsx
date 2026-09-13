"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Company } from "@/types/crm";
import {
  SEGMENTS,
  SEGMENT_LABELS,
  FUNNEL_STAGES,
  TRIGGER_TYPES,
  OFFER_TYPES,
  SOURCES,
} from "@/types/crm";
import { STAGE_LABELS, OFFER_LABELS, TRIGGER_LABELS } from "@/lib/offers";

type Props = {
  company?: Company;
  action: (formData: FormData) => Promise<{ error?: string; ok?: boolean } | void>;
  submitLabel?: string;
};

export function CompanyForm({ company, action, submitLabel = "Save" }: Props) {
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
          <Label htmlFor="name">Company *</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={company?.name || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            placeholder="Germany, UK, …"
            defaultValue={company?.country || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            name="industry"
            placeholder="AI, Fintech, …"
            defaultValue={company?.industry || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="segment">Segment</Label>
          <select
            id="segment"
            name="segment"
            defaultValue={company?.segment || ""}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="">—</option>
            {SEGMENTS.map((s) => (
              <option key={s} value={s}>
                {SEGMENT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <select
            id="source"
            name="source"
            defaultValue={company?.source || ""}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="">—</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            type="url"
            defaultValue={company?.website || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="linkedin_url">LinkedIn</Label>
          <Input
            id="linkedin_url"
            name="linkedin_url"
            type="url"
            defaultValue={company?.linkedin_url || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="careers_url">Careers</Label>
          <Input
            id="careers_url"
            name="careers_url"
            type="url"
            defaultValue={company?.careers_url || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stage">Stage</Label>
          <select
            id="stage"
            name="stage"
            defaultValue={company?.stage || "found"}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            {FUNNEL_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="funding_amount_eur">Funding (€)</Label>
          <Input
            id="funding_amount_eur"
            name="funding_amount_eur"
            type="number"
            placeholder="8000000"
            defaultValue={company?.funding_amount_eur ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="funding_round">Round</Label>
          <Input
            id="funding_round"
            name="funding_round"
            placeholder="Series A"
            defaultValue={company?.funding_round || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="funding_date">Funding date</Label>
          <Input
            id="funding_date"
            name="funding_date"
            type="date"
            defaultValue={company?.funding_date || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employees">Employees</Label>
          <Input
            id="employees"
            name="employees"
            type="number"
            defaultValue={company?.employees ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hiring_count">Hiring count</Label>
          <Input
            id="hiring_count"
            name="hiring_count"
            type="number"
            defaultValue={company?.hiring_count ?? ""}
          />
        </div>
        <div className="flex items-end gap-2 pb-1">
          <input
            id="hiring"
            name="hiring"
            type="checkbox"
            value="true"
            defaultChecked={!!company?.hiring}
            className="size-4 rounded border"
          />
          <Label htmlFor="hiring">Hiring developers</Label>
        </div>
        <div className="space-y-2 sm:col-span-3">
          <Label htmlFor="hiring_roles">Hiring roles</Label>
          <Input
            id="hiring_roles"
            name="hiring_roles"
            placeholder="Senior React, Backend, Full Stack…"
            defaultValue={company?.hiring_roles || ""}
          />
        </div>
        <div className="space-y-2 sm:col-span-3">
          <Label htmlFor="tech_stack">Tech stack (comma-separated)</Label>
          <Input
            id="tech_stack"
            name="tech_stack"
            placeholder="React, Next.js, Node.js"
            defaultValue={(company?.tech_stack || []).join(", ")}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="trigger_type">Trigger</Label>
          <select
            id="trigger_type"
            name="trigger_type"
            defaultValue={company?.trigger_type || ""}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="">—</option>
            {TRIGGER_TYPES.map((t) => (
              <option key={t} value={t}>
                {TRIGGER_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer_type">Offer</Label>
          <select
            id="offer_type"
            name="offer_type"
            defaultValue={company?.offer_type || ""}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="">—</option>
            {OFFER_TYPES.map((o) => (
              <option key={o} value={o}>
                {OFFER_LABELS[o]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="has_founder_contact"
            name="has_founder_contact"
            type="checkbox"
            className="size-4 rounded border"
          />
          <Label htmlFor="has_founder_contact">
            CTO / Founder already identified (+1 score)
          </Label>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="reason">Why this company?</Label>
          <Textarea
            id="reason"
            name="reason"
            rows={2}
            defaultValue={company?.reason || ""}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={company?.notes || ""}
          />
        </div>
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
