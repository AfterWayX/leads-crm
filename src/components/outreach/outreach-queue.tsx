"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateOutreachStatusAction } from "@/app/(app)/companies/actions";

type Row = {
  id: string;
  company_id: string;
  status: string;
  channel: string;
  subject: string | null;
  body: string | null;
  follow_up_at: string | null;
  created_at: string;
  companies: { name: string } | null;
};

function OutreachSection({
  title,
  description,
  items,
  actions,
}: {
  title: string;
  description: string;
  items: Row[];
  actions: (row: Row) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-zinc-500">Nothing here.</p>
        )}
        {items.map((row) => (
          <div
            key={row.id}
            className="rounded-md border border-zinc-100 bg-zinc-50 p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link
                  href={`/companies/${row.company_id}`}
                  className="font-medium hover:underline"
                >
                  {row.companies?.name || "Company"}
                </Link>
                <div className="mt-1 flex gap-2">
                  <Badge variant="outline">{row.channel}</Badge>
                  <Badge>{row.status}</Badge>
                  {row.follow_up_at && (
                    <span className="text-xs text-amber-700">
                      follow-up {row.follow_up_at}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">{actions(row)}</div>
            </div>
            {row.subject && (
              <p className="mt-2 text-sm font-medium">{row.subject}</p>
            )}
            {row.body && (
              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap font-sans text-sm text-zinc-600">
                {row.body}
              </pre>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function OutreachQueue({
  drafts,
  approved,
  followUps,
}: {
  drafts: Row[];
  approved: Row[];
  followUps: Row[];
}) {
  const [pending, startTransition] = useTransition();

  function setStatus(id: string, status: string, companyId: string) {
    startTransition(async () => {
      await updateOutreachStatusAction(id, status, companyId);
    });
  }

  return (
    <div className={`space-y-6 ${pending ? "opacity-80" : ""}`}>
      <OutreachSection
        title="Drafts — approve before send"
        description="Review personalized messages. You send manually."
        items={drafts}
        actions={(row) => (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setStatus(row.id, "approved", row.company_id)}
          >
            Approve
          </Button>
        )}
      />
      <OutreachSection
        title="Approved — ready to send"
        description="Copy into LinkedIn/email, then mark as sent."
        items={approved}
        actions={(row) => (
          <Button
            size="sm"
            onClick={() => setStatus(row.id, "sent", row.company_id)}
          >
            Mark sent
          </Button>
        )}
      />
      <OutreachSection
        title="Follow-ups due"
        description="Messages with follow-up dates on or before today."
        items={followUps}
        actions={(row) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setStatus(row.id, "replied", row.company_id)}
          >
            Mark replied
          </Button>
        )}
      />
    </div>
  );
}
