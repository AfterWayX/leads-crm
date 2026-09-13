import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TemperatureBadge } from "@/components/companies/temperature-badge";
import {
  APPLY_QUEUE_LABELS,
  type ApplicantProfile,
  type AutoApplyCapacity,
  type ApplyQueueStatus,
} from "@/lib/auto-apply";
import { prepareAutoApplyBatchAction } from "../auto-apply-actions";
import type { JobApplication } from "@/types/crm";

export default async function AutoApplyPage() {
  const supabase = await createClient();

  const [{ data: profileRaw }, { data: capacityRaw }, { data: ready }, { data: blocked }] =
    await Promise.all([
      supabase
        .from("applicant_profile")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase.rpc("auto_apply_capacity"),
      supabase
        .from("job_applications")
        .select("*")
        .in("apply_queue_status", ["queued", "materials_ready", "applying"])
        .order("priority", { ascending: true })
        .order("fit_score", { ascending: false }),
      supabase
        .from("job_applications")
        .select("*")
        .eq("apply_queue_status", "blocked")
        .order("updated_at", { ascending: false })
        .limit(20),
    ]);

  const profile = profileRaw as ApplicantProfile | null;
  const capacity = (capacityRaw || {
    daily_cap: 8,
    applied_today: 0,
    remaining_today: 8,
    queued: 0,
    blocked: 0,
    materials_ready: 0,
  }) as AutoApplyCapacity;

  const readyRows = (ready || []) as JobApplication[];
  const blockedRows = (blocked || []) as JobApplication[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/jobs" className="text-sm text-zinc-500 hover:underline">
            ← Jobs
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Auto-apply engine
          </h1>
          <p className="text-sm text-zinc-500">
            Prepares materials and runs external ATS / email applications without
            LinkedIn Easy Apply bots.
          </p>
        </div>
        <form action={prepareAutoApplyBatchAction}>
          <Button type="submit">Prepare next batch</Button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Remaining today</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {capacity.remaining_today}/{capacity.daily_cap}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Materials ready</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {capacity.materials_ready}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Blocked</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {capacity.blocked}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Profile</CardDescription>
            <CardTitle className="text-base">
              {profile ? profile.full_name : "Missing — run seed migration"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How it runs without you</CardTitle>
          <CardDescription>
            Say in Cursor: <code>run auto-apply batch</code>. The agent uses your
            profile, PDF CV, cover letters, and browser session for company ATS /
            Gmail — not LinkedIn auto-submit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-600">
          <p>
            Policy: skip LinkedIn Easy Apply automation (account ban risk). Prefer
            Ashby / Greenhouse / Lever / Workable / company career pages / email.
          </p>
          <p>
            Assets:{" "}
            <code className="text-xs">{profile?.cv_pdf_path || "docs/job-hunt/David_Beregoi_CV.pdf"}</code>
          </p>
          <p>
            Engine prompt:{" "}
            <code className="text-xs">scripts/auto-apply-engine-prompt.txt</code>
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Ready queue</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>P</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readyRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-zinc-500">
                    Queue empty. Click Prepare next batch.
                  </TableCell>
                </TableRow>
              )}
              {readyRows.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>{j.priority}</TableCell>
                  <TableCell>
                    <Link href={`/jobs/${j.id}`} className="font-medium hover:underline">
                      {j.company_name}
                    </Link>
                    <p className="max-w-sm truncate text-xs text-zinc-500">{j.title}</p>
                  </TableCell>
                  <TableCell>{j.apply_mode || "ats"}</TableCell>
                  <TableCell>
                    {APPLY_QUEUE_LABELS[(j.apply_queue_status || "idle") as ApplyQueueStatus]}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums">{j.fit_score}/10</span>
                      <TemperatureBadge value={j.temperature} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {blockedRows.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Blocked (needs one fix)</h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedRows.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell>
                      <Link href={`/jobs/${j.id}`} className="hover:underline">
                        {j.company_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      {j.blocked_reason || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
