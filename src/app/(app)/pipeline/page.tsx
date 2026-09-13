import { createClient } from "@/lib/supabase/server";
import {
  PipelineBoard,
  type PipelineCompany,
} from "@/components/pipeline/pipeline-board";

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("*, contacts(name, linkedin_url, is_primary)")
    .order("score", { ascending: false });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="text-sm text-zinc-500">
          Drag companies between funnel stages. Focus on score ≥ 6.
        </p>
      </div>
      <PipelineBoard companies={(data || []) as PipelineCompany[]} />
    </div>
  );
}
