import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyForm } from "@/components/companies/company-form";
import { ContactsPanel } from "@/components/companies/contacts-panel";
import { PitchGenerator } from "@/components/companies/pitch-generator";
import { TemperatureBadge } from "@/components/companies/temperature-badge";
import {
  updateCompanyAction,
  recalculateScoreAction,
  deleteCompanyAction,
} from "../actions";
import { OFFER_LABELS, TRIGGER_LABELS, STAGE_LABELS, OUTREACH_STATUS_LABELS } from "@/lib/offers";
import { formatFunding } from "@/lib/format";
import type { Company, Contact, Outreach, OfferType, TriggerType } from "@/types/crm";

type Params = Promise<{ id: string }>;

export default async function CompanyDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (!company) notFound();

  const [{ data: contacts }, { data: outreach }] = await Promise.all([
    supabase
      .from("contacts")
      .select("*")
      .eq("company_id", id)
      .order("is_primary", { ascending: false }),
    supabase
      .from("outreach")
      .select("*")
      .eq("company_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const c = company as Company;
  const contactList = (contacts || []) as Contact[];
  const outreachList = (outreach || []) as Outreach[];
  const breakdown = (c.score_breakdown || {}) as Record<string, number>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/companies" className="text-sm text-zinc-500 hover:underline">
            ← Companies
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{c.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TemperatureBadge value={c.temperature} />
            <Badge variant="outline">{c.score}/10</Badge>
            <Badge variant="secondary">{STAGE_LABELS[c.stage] || c.stage}</Badge>
            {c.trigger_type && (
              <Badge variant="outline">
                {TRIGGER_LABELS[c.trigger_type as TriggerType] || c.trigger_type}
              </Badge>
            )}
            {c.offer_type && (
              <Badge variant="outline">
                {OFFER_LABELS[c.offer_type as OfferType] || c.offer_type}
              </Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            {formatFunding(c.funding_amount_eur, c.funding_round)}
            {c.funding_date ? ` · ${c.funding_date}` : ""}
            {c.employees ? ` · ${c.employees} employees` : ""}
            {c.website ? (
              <>
                {" · "}
                <a
                  href={c.website}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  website
                </a>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          <form
            action={async () => {
              "use server";
              await recalculateScoreAction(id);
            }}
          >
            <Button type="submit" variant="secondary">
              Recalculate score
            </Button>
          </form>
          <form
            action={async () => {
              "use server";
              await deleteCompanyAction(id);
            }}
          >
            <Button type="submit" variant="outline">
              Delete
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Score breakdown</CardTitle>
            <CardDescription>
              +2 funding &lt;3mo · +2 hiring · +2 size 10–100 · +2 SaaS/AI · +1
              founder · +1 stack
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {[
                ["recent_funding", "Recent funding"],
                ["hiring_devs", "Hiring developers"],
                ["employee_range", "Employee range 10–100"],
                ["saas_ai_product", "SaaS / AI product"],
                ["founder_identified", "CTO / Founder identified"],
                ["stack_match", "Stack match"],
              ].map(([key, label]) => (
                <li
                  key={key}
                  className="flex items-center justify-between border-b border-zinc-100 py-1"
                >
                  <span>{label}</span>
                  <span className="tabular-nums font-medium">
                    +{breakdown[key] || 0}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>
              Company → Founder/CTO → LinkedIn → Email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactsPanel companyId={id} contacts={contactList} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pitch generator</CardTitle>
            <CardDescription>
              Personalized draft — you approve before sending. Not automated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PitchGenerator company={c} contacts={contactList} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Outreach timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {outreachList.length === 0 ? (
              <p className="text-sm text-zinc-500">No outreach yet.</p>
            ) : (
              <ul className="space-y-3">
                {outreachList.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-md border border-zinc-100 bg-zinc-50 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="outline">{o.channel}</Badge>
                      <Badge>
                        {OUTREACH_STATUS_LABELS[o.status] || o.status}
                      </Badge>
                      <span className="text-zinc-500">
                        {new Date(o.created_at).toLocaleString()}
                      </span>
                      {o.follow_up_at && (
                        <span className="text-amber-700">
                          follow-up {o.follow_up_at}
                        </span>
                      )}
                    </div>
                    {o.subject && (
                      <p className="mt-1 font-medium">{o.subject}</p>
                    )}
                    {o.body && (
                      <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-zinc-600">
                        {o.body}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Edit company</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanyForm
              company={c}
              action={updateCompanyAction.bind(null, id)}
              submitLabel="Update company"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
