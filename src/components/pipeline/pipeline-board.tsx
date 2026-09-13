"use client";

import { useTransition } from "react";
import Link from "next/link";
import { updateCompanyStageAction } from "@/app/(app)/companies/actions";
import { TemperatureBadge } from "@/components/companies/temperature-badge";
import { FUNNEL_STAGES } from "@/types/crm";
import { STAGE_LABELS } from "@/lib/offers";
import type { Company } from "@/types/crm";

export function PipelineBoard({ companies }: { companies: Company[] }) {
  const [pending, startTransition] = useTransition();

  const byStage = FUNNEL_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = companies.filter((c) => c.stage === stage);
      return acc;
    },
    {} as Record<string, Company[]>
  );

  function onDrop(stage: string, companyId: string) {
    startTransition(async () => {
      await updateCompanyStageAction(companyId, stage);
    });
  }

  const columns = [
    ...FUNNEL_STAGES.filter((s) => s !== "lost"),
    "lost" as const,
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {columns.map((stage) => (
        <div
          key={stage}
          className="flex w-64 shrink-0 flex-col rounded-lg border border-zinc-200 bg-white"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData("text/company-id");
            if (id) onDrop(stage, id);
          }}
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
            <h3 className="text-sm font-medium">{STAGE_LABELS[stage]}</h3>
            <span className="text-xs text-zinc-400">
              {byStage[stage]?.length || 0}
            </span>
          </div>
          <div className={`min-h-[120px] space-y-2 p-2 ${pending ? "opacity-70" : ""}`}>
            {(byStage[stage] || []).map((c) => (
              <div
                key={c.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/company-id", c.id);
                }}
                className="cursor-grab rounded-md border border-zinc-100 bg-zinc-50 p-2 active:cursor-grabbing"
              >
                <Link
                  href={`/companies/${c.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {c.name}
                </Link>
                <div className="mt-1 flex items-center justify-between gap-1">
                  <span className="text-xs tabular-nums text-zinc-500">
                    {c.score}/10
                  </span>
                  <TemperatureBadge value={c.temperature} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
