import { createClient } from "@/lib/supabase/server";
import {
  RecruiterBoard,
  type RecruiterBoardJob,
} from "@/components/jobs/recruiter-board";

export default async function RecruitersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_applications")
    .select("*, job_contacts(*)")
    .in("stage", ["applied", "screening", "interview"])
    .order("fit_score", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Recruiter outreach
        </h1>
        <p className="text-sm text-zinc-500">
          Find recruiters for applied jobs, invite them with job context, then
          message after they accept.
        </p>
      </div>
      <RecruiterBoard jobs={(data || []) as RecruiterBoardJob[]} />
    </div>
  );
}
