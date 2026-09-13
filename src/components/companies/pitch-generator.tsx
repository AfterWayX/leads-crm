"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generatePitch } from "@/lib/templates";
import { formatFunding } from "@/lib/format";
import type { Company, Contact } from "@/types/crm";
import { createOutreachDraftAction } from "@/app/(app)/companies/actions";

function defaultFollowUpDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export function PitchGenerator({
  company,
  contacts,
}: {
  company: Company;
  contacts: Contact[];
}) {
  const primary = contacts.find((c) => c.is_primary) || contacts[0];
  const [contactId, setContactId] = useState(primary?.id || "");
  const [channel, setChannel] = useState("linkedin");
  const [followUp, setFollowUp] = useState("");
  const contact = contacts.find((c) => c.id === contactId);

  const funding = formatFunding(
    company.funding_amount_eur,
    company.funding_round
  );

  const generated = useMemo(
    () =>
      generatePitch({
        name: contact?.name?.split(" ")[0] || "there",
        company: company.name,
        funding: funding !== "—" ? funding : undefined,
        roles: company.hiring_roles || undefined,
        offer: company.offer_type,
        trigger: company.trigger_type || (company.hiring ? "hiring" : "funding"),
      }),
    [company, contact, funding]
  );

  const [subject, setSubject] = useState(generated.subject);
  const [body, setBody] = useState(generated.body);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Contact</Label>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="border-input h-9 w-full rounded-md border bg-white px-2 text-sm"
          >
            <option value="">No contact</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.title ? ` — ${c.title}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Channel</Label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="border-input h-9 w-full rounded-md border bg-white px-2 text-sm"
          >
            <option value="linkedin">LinkedIn</option>
            <option value="email">Email</option>
            <option value="call">Call</option>
          </select>
        </div>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          const next = generatePitch({
            name: contact?.name?.split(" ")[0] || "there",
            company: company.name,
            funding: funding !== "—" ? funding : undefined,
            roles: company.hiring_roles || undefined,
            offer: company.offer_type,
            trigger:
              company.trigger_type || (company.hiring ? "hiring" : "funding"),
          });
          setSubject(next.subject);
          setBody(next.body);
          setSaved(false);
        }}
      >
        Regenerate from template
      </Button>
      <div className="space-y-1">
        <Label>Subject</Label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Message</Label>
        <Textarea
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label>Follow-up date</Label>
        <Input
          type="date"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
        />
      </div>
      <Button
        disabled={pending}
        onClick={() => {
          const fd = new FormData();
          fd.set("contact_id", contactId);
          fd.set("channel", channel);
          fd.set("subject", subject);
          fd.set("body", body);
          if (followUp) fd.set("follow_up_at", followUp);
          else fd.set("follow_up_at", defaultFollowUpDate());
          startTransition(async () => {
            await createOutreachDraftAction(company.id, fd);
            setSaved(true);
          });
        }}
      >
        {pending ? "Saving draft…" : "Save as draft for approval"}
      </Button>
      {saved && (
        <p className="text-sm text-emerald-700">
          Draft saved — review it in Outreach.
        </p>
      )}
    </div>
  );
}
