import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import type { Company } from "@/types/crm";

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .order("score", { ascending: false });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="text-sm text-zinc-500">
          Drag companies between funnel stages. Focus on score ≥ 6.
        </p>
      </div>
      <PipelineBoard companies={(data || []) as Company[]} />
    </div>
  );
}
