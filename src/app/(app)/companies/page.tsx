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
import { LinkedInContactLink } from "@/components/companies/linkedin-contact-link";
import { pickLinkedInContact, type ContactLite } from "@/lib/contacts";
import { formatFunding } from "@/lib/format";
import { SEGMENT_LABELS, SEGMENTS, FUNNEL_STAGES, TEMPERATURES } from "@/types/crm";
import { STAGE_LABELS } from "@/lib/offers";
import type { Company } from "@/types/crm";

type SearchParams = Promise<{
  q?: string;
  segment?: string;
  stage?: string;
  temperature?: string;
  min_score?: string;
}>;

type CompanyRow = Company & {
  contacts?: ContactLite[] | null;
};

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("companies")
    .select("*, contacts(name, linkedin_url, is_primary)")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false });

  if (sp.q) {
    query = query.ilike("name", `%${sp.q}%`);
  }
  if (sp.segment) query = query.eq("segment", sp.segment);
  if (sp.stage) query = query.eq("stage", sp.stage);
  if (sp.temperature) query = query.eq("temperature", sp.temperature);
  if (sp.min_score) query = query.gte("score", Number(sp.min_score));

  const { data: companies } = await query;
  const rows = (companies || []) as CompanyRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-sm text-zinc-500">
            {rows.length} companies · aim for score ≥ 6
          </p>
        </div>
        <Button asChild>
          <Link href="/companies/new">Add company</Link>
        </Button>
      </div>

      <form className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-200 bg-white p-3">
        <div className="min-w-[160px] flex-1 space-y-1">
          <label className="text-xs text-zinc-500">Search</label>
          <Input name="q" defaultValue={sp.q || ""} placeholder="Company name" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Segment</label>
          <select
            name="segment"
            defaultValue={sp.segment || ""}
            className="border-input h-9 rounded-md border bg-white px-2 text-sm"
          >
            <option value="">All</option>
            {SEGMENTS.map((s) => (
              <option key={s} value={s}>
                {SEGMENT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Stage</label>
          <select
            name="stage"
            defaultValue={sp.stage || ""}
            className="border-input h-9 rounded-md border bg-white px-2 text-sm"
          >
            <option value="">All</option>
            {FUNNEL_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
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
          <label className="text-xs text-zinc-500">Min score</label>
          <Input
            name="min_score"
            type="number"
            className="w-20"
            defaultValue={sp.min_score || ""}
            placeholder="6"
          />
        </div>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>LinkedIn contact</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Funding</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Hiring</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Stage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-zinc-500">
                  No companies yet.{" "}
                  <Link href="/companies/new" className="underline">
                    Add your first lead
                  </Link>
                </TableCell>
              </TableRow>
            )}
            {rows.map((c) => {
              const contact = pickLinkedInContact(c.contacts);
              return (
                <TableRow key={c.id} className="hover:bg-zinc-50">
                  <TableCell>
                    <Link
                      href={`/companies/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {contact ? (
                      <LinkedInContactLink
                        name={contact.name}
                        href={contact.linkedin_url}
                        className="text-sm"
                      />
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>{c.country || "—"}</TableCell>
                  <TableCell>
                    {c.segment
                      ? SEGMENT_LABELS[c.segment as keyof typeof SEGMENT_LABELS] ||
                        c.segment
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {formatFunding(c.funding_amount_eur, c.funding_round)}
                  </TableCell>
                  <TableCell>{c.employees ?? "—"}</TableCell>
                  <TableCell>
                    {c.hiring
                      ? c.hiring_count
                        ? `${c.hiring_count} roles`
                        : "Yes"
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums font-medium">{c.score}/10</span>
                      <TemperatureBadge value={c.temperature} />
                    </div>
                  </TableCell>
                  <TableCell>{STAGE_LABELS[c.stage] || c.stage}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
