import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TemperatureBadge } from "@/components/companies/temperature-badge";
import { formatSalaryRange } from "@/lib/jobs";
import {
  JOB_PRIORITIES,
  JOB_STAGES,
  JOB_STAGE_LABELS,
  TEMPERATURES,
  type JobApplication,
  type JobApplicationStats,
} from "@/types/crm";

type SearchParams = Promise<{
  q?: string;
  stage?: string;
  temperature?: string;
  priority?: string;
  moldova?: string;
}>;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("job_applications")
    .select("*")
    .order("priority", { ascending: true })
    .order("fit_score", { ascending: false })
    .order("created_at", { ascending: false });

  if (sp.q) {
    query = query.or(
      `company_name.ilike.%${sp.q}%,title.ilike.%${sp.q}%`
    );
  }
  if (sp.stage) query = query.eq("stage", sp.stage);
  if (sp.temperature) query = query.eq("temperature", sp.temperature);
  if (sp.priority) query = query.eq("priority", sp.priority);
  if (sp.moldova === "1") query = query.eq("moldova_eligible", true);

  const [{ data: jobs }, { data: statsRaw }] = await Promise.all([
    query,
    supabase.rpc("job_application_stats"),
  ]);

  const rows = (jobs || []) as JobApplication[];
  const stats = (statsRaw || {
    by_stage: {},
    by_temperature: {},
    total: 0,
    hot_or_good: 0,
    applied_count: 0,
    follow_ups_due: 0,
  }) as JobApplicationStats;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-zinc-500">
            {rows.length} shown · {stats.hot_or_good} HOT/GOOD ·{" "}
            {stats.applied_count} in pipeline · {stats.follow_ups_due} follow-ups
            due
          </p>
        </div>
        <Button asChild>
          <Link href="/jobs/new">Add job</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {(["saved", "applied", "interview", "offer"] as const).map((s) => (
          <div
            key={s}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2"
          >
            <p className="text-xs text-zinc-500">{JOB_STAGE_LABELS[s]}</p>
            <p className="text-lg font-semibold tabular-nums">
              {stats.by_stage?.[s] ?? 0}
            </p>
          </div>
        ))}
      </div>

      <form className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-200 bg-white p-3">
        <div className="min-w-[160px] flex-1 space-y-1">
          <label className="text-xs text-zinc-500">Search</label>
          <Input
            name="q"
            defaultValue={sp.q || ""}
            placeholder="Company or title"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Stage</label>
          <select
            name="stage"
            defaultValue={sp.stage || ""}
            className="border-input h-9 rounded-md border bg-white px-2 text-sm"
          >
            <option value="">All</option>
            {JOB_STAGES.map((s) => (
              <option key={s} value={s}>
                {JOB_STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Temp</label>
          <select
            name="temperature"
            defaultValue={sp.temperature || ""}
            className="border-input h-9 rounded-md border bg-white px-2 text-sm"
          >
            <option value="">All</option>
            {TEMPERATURES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Priority</label>
          <select
            name="priority"
            defaultValue={sp.priority || ""}
            className="border-input h-9 rounded-md border bg-white px-2 text-sm"
          >
            <option value="">All</option>
            {JOB_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 pb-1">
          <input
            id="moldova"
            name="moldova"
            type="checkbox"
            value="1"
            defaultChecked={sp.moldova === "1"}
            className="size-4 rounded border"
          />
          <label htmlFor="moldova" className="text-xs text-zinc-600">
            Moldova only
          </label>
        </div>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>P</TableHead>
              <TableHead>Company / Role</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>MD</TableHead>
              <TableHead>Fit</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Apply</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-zinc-500"
                >
                  No jobs yet. Run the seed migration or{" "}
                  <Link href="/jobs/new" className="underline">
                    add a role
                  </Link>
                  . See{" "}
                  <code className="text-xs">docs/job-hunt/TARGET_ROLES.md</code>
                  .
                </TableCell>
              </TableRow>
            )}
            {rows.map((j) => (
              <TableRow key={j.id} className="hover:bg-zinc-50">
                <TableCell className="font-medium">{j.priority}</TableCell>
                <TableCell>
                  <Link
                    href={`/jobs/${j.id}`}
                    className="font-medium hover:underline"
                  >
                    {j.company_name}
                  </Link>
                  <p className="max-w-xs truncate text-xs text-zinc-500">
                    {j.title}
                  </p>
                </TableCell>
                <TableCell>{j.region || "—"}</TableCell>
                <TableCell className="text-sm">
                  {formatSalaryRange(j.salary_min_usd, j.salary_max_usd)}
                </TableCell>
                <TableCell>{j.moldova_eligible ? "✓" : "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums font-medium">
                      {j.fit_score}/10
                    </span>
                    <TemperatureBadge value={j.temperature} />
                  </div>
                </TableCell>
                <TableCell>
                  {JOB_STAGE_LABELS[j.stage as keyof typeof JOB_STAGE_LABELS] ||
                    j.stage}
                </TableCell>
                <TableCell>
                  {j.apply_url ? (
                    <a
                      href={j.apply_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Open
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
