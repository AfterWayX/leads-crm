import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FUNNEL_STAGES, SEGMENT_TARGETS, SEGMENT_LABELS, SEGMENTS } from "@/types/crm";
import { STAGE_LABELS } from "@/lib/offers";
import type { DashboardStats } from "@/types/crm";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("dashboard_stats");
  const stats = (data || {
    by_stage: {},
    by_temperature: {},
    by_segment: {},
    total: 0,
    hot_or_good: 0,
  }) as DashboardStats;

  const stageOrder = FUNNEL_STAGES.filter((s) => s !== "lost");
  const maxStage = Math.max(
    1,
    ...stageOrder.map((s) => stats.by_stage[s] || 0)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500">
            Funnel: found → qualified → invite sent → message sent →
            replies → calls → opportunities → clients
          </p>
        </div>
        <Button asChild>
          <Link href="/companies/new">Add company</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total companies</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-500">
            Target: 100 qualified leads
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>HOT + GOOD</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {stats.hot_or_good}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-500">
            Score ≥ 6 — worth contacting
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Temperature mix</CardDescription>
            <CardTitle className="text-base font-medium">
              HOT {stats.by_temperature.HOT || 0} · GOOD{" "}
              {stats.by_temperature.GOOD || 0} · MAYBE{" "}
              {stats.by_temperature.MAYBE || 0} · IGNORE{" "}
              {stats.by_temperature.IGNORE || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funnel by stage</CardTitle>
          <CardDescription>
            Goal: 100 outreaches → 10–20 replies → 5–10 calls → 2–3 opportunities
            → first client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stageOrder.map((stage) => {
            const count = stats.by_stage[stage] || 0;
            const pct = Math.round((count / maxStage) * 100);
            return (
              <div key={stage} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{STAGE_LABELS[stage]}</span>
                  <span className="tabular-nums text-zinc-500">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-zinc-800"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segment targets (first 100)</CardTitle>
          <CardDescription>
            30 AI/SaaS · 20 Fintech · 20 Logistics · 20 B2B SaaS · 10 wild cards
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {SEGMENTS.map((seg) => {
            const count = stats.by_segment[seg] || 0;
            const target = SEGMENT_TARGETS[seg];
            const pct = Math.min(100, Math.round((count / target) * 100));
            return (
              <div key={seg} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{SEGMENT_LABELS[seg]}</span>
                  <span className="tabular-nums text-zinc-500">
                    {count}/{target}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-emerald-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
