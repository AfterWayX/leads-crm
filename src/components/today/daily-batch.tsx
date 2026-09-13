"use client";

import { useState, useTransition } from "react";
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
import { LinkedInContactLink } from "@/components/companies/linkedin-contact-link";
import {
  approveMessageAction,
  buildDailyBatchAction,
  markInviteAcceptedAction,
  markInviteIgnoredAction,
  markInviteSentAction,
  markMessageSentAction,
  updateMessageBodyAction,
} from "@/app/(app)/today/actions";
import { daysSince, isStalePending } from "@/lib/invites";
import { OUTREACH_STATUS_LABELS } from "@/lib/offers";
import type { InviteCapacity } from "@/types/crm";

export type TodayInviteRow = {
  id: string;
  company_id: string;
  contact_id: string | null;
  status: string;
  subject: string | null;
  body: string | null;
  sent_at: string | null;
  created_at: string;
  companies: { name: string; score: number; temperature: string | null } | null;
  contacts: {
    name: string;
    linkedin_url: string | null;
    linkedin_verified: boolean;
  } | null;
};

export type TodayMessageRow = {
  id: string;
  company_id: string;
  contact_id: string | null;
  status: string;
  subject: string | null;
  body: string | null;
  companies: { name: string } | null;
  contacts: { name: string; linkedin_url: string | null } | null;
};

export function DailyBatch({
  capacity,
  queued,
  pending,
  messageDrafts,
}: {
  capacity: InviteCapacity;
  queued: TodayInviteRow[];
  pending: TodayInviteRow[];
  messageDrafts: TodayMessageRow[];
}) {
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ error?: string } | { ok?: boolean }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res && "error" in res && res.error) setError(res.error);
    });
  }

  return (
    <div className={`space-y-6 ${busy ? "opacity-80" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <div>
          <p className="text-sm font-medium">Invite capacity</p>
          <p className="text-sm text-zinc-500">
            {capacity.sent_today} sent today · {capacity.remaining_today} left
            today · {capacity.sent_7d} this week · {capacity.remaining_week}{" "}
            left this week
          </p>
        </div>
        <Button
          onClick={() =>
            run(async () => {
              const res = await buildDailyBatchAction();
              if (res.error) return res;
              return { ok: true };
            })
          }
          variant="secondary"
        >
          Build today&apos;s batch
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Send today ({queued.length})</CardTitle>
          <CardDescription>
            Open LinkedIn, Connect without a note, then mark invited. Cap{" "}
            {capacity.daily_cap}/day.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {queued.length === 0 && (
            <p className="text-sm text-zinc-500">
              Nothing queued. Click &quot;Build today&apos;s batch&quot; or wait
              for the morning automation.
            </p>
          )}
          {queued.map((row) => (
            <InviteCard
              key={row.id}
              row={row}
              actions={
                <>
                  {row.contacts?.linkedin_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={row.contacts.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open LinkedIn
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() =>
                      run(() => markInviteSentAction(row.id, row.company_id))
                    }
                  >
                    Mark invited
                  </Button>
                </>
              }
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Waiting on acceptance ({pending.length})</CardTitle>
          <CardDescription>
            Pending invites. After 21 days, withdraw on LinkedIn and mark
            ignored.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 && (
            <p className="text-sm text-zinc-500">No pending invites.</p>
          )}
          {pending.map((row) => {
            const age = daysSince(row.sent_at);
            const stale = isStalePending(row.sent_at);
            return (
              <InviteCard
                key={row.id}
                row={row}
                meta={
                  age !== null ? (
                    <span
                      className={
                        stale
                          ? "text-xs text-amber-700"
                          : "text-xs text-zinc-500"
                      }
                    >
                      {age}d ago
                      {stale ? " — consider withdrawing" : ""}
                    </span>
                  ) : null
                }
                actions={
                  <>
                    {row.contacts?.linkedin_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={row.contacts.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open LinkedIn
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        run(() =>
                          markInviteAcceptedAction(
                            row.id,
                            row.company_id,
                            row.contact_id
                          )
                        )
                      }
                    >
                      Mark accepted
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        run(() =>
                          markInviteIgnoredAction(row.id, row.company_id)
                        )
                      }
                    >
                      Mark ignored
                    </Button>
                  </>
                }
              />
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Accepted — message ready ({messageDrafts.length})
          </CardTitle>
          <CardDescription>
            Approve or edit the short DM, then send on LinkedIn and mark sent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {messageDrafts.length === 0 && (
            <p className="text-sm text-zinc-500">
              No drafts yet. Marking an invite accepted generates one.
            </p>
          )}
          {messageDrafts.map((row) => (
            <MessageDraftCard key={row.id} row={row} run={run} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function InviteCard({
  row,
  actions,
  meta,
}: {
  row: TodayInviteRow;
  actions: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-zinc-100 bg-zinc-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            href={`/companies/${row.company_id}`}
            className="font-medium hover:underline"
          >
            {row.companies?.name || "Company"}
          </Link>
          {row.contacts?.name && (
            <div className="mt-0.5 text-sm">
              <LinkedInContactLink
                name={row.contacts.name}
                href={row.contacts.linkedin_url}
              />
              {!row.contacts.linkedin_verified && (
                <Badge variant="outline" className="ml-2 text-xs">
                  unverified
                </Badge>
              )}
            </div>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge>{OUTREACH_STATUS_LABELS[row.status] || row.status}</Badge>
            {typeof row.companies?.score === "number" && (
              <span className="text-xs tabular-nums text-zinc-500">
                {row.companies.score}/10
              </span>
            )}
            {meta}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
    </div>
  );
}

function MessageDraftCard({
  row,
  run,
}: {
  row: TodayMessageRow;
  run: (fn: () => Promise<{ error?: string } | { ok?: boolean }>) => void;
}) {
  const [body, setBody] = useState(row.body || "");

  return (
    <div className="rounded-md border border-zinc-100 bg-zinc-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            href={`/companies/${row.company_id}`}
            className="font-medium hover:underline"
          >
            {row.companies?.name || "Company"}
          </Link>
          {row.contacts?.name && (
            <div className="mt-0.5 text-sm">
              <LinkedInContactLink
                name={row.contacts.name}
                href={row.contacts.linkedin_url}
              />
            </div>
          )}
          <div className="mt-1">
            <Badge>{OUTREACH_STATUS_LABELS[row.status] || row.status}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {row.contacts?.linkedin_url && (
            <Button size="sm" variant="outline" asChild>
              <a
                href={row.contacts.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open LinkedIn
              </a>
            </Button>
          )}
          {row.status === "draft" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                run(async () => {
                  if (body !== row.body) {
                    const u = await updateMessageBodyAction(
                      row.id,
                      row.company_id,
                      body
                    );
                    if (u.error) return u;
                  }
                  return approveMessageAction(row.id, row.company_id);
                })
              }
            >
              Approve
            </Button>
          )}
          {row.status === "approved" && (
            <Button
              size="sm"
              onClick={() =>
                run(() => markMessageSentAction(row.id, row.company_id))
              }
            >
              Mark sent
            </Button>
          )}
        </div>
      </div>
      {row.subject && (
        <p className="mt-2 text-sm font-medium">{row.subject}</p>
      )}
      <textarea
        className="mt-2 w-full rounded-md border border-zinc-200 bg-white p-2 font-sans text-sm text-zinc-700"
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={400}
      />
      <p className="mt-1 text-xs text-zinc-400">{body.length}/400</p>
    </div>
  );
}
