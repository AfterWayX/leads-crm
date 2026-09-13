import { createClient } from "@/lib/supabase/server";
import { OutreachQueue } from "@/components/outreach/outreach-queue";

export default async function OutreachPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const select = "*, companies(name), contacts(name, linkedin_url)";

  const [
    { data: drafts },
    { data: approved },
    { data: followUps },
  ] = await Promise.all([
    supabase
      .from("outreach")
      .select(select)
      .eq("kind", "message")
      .eq("status", "draft")
      .order("created_at", { ascending: false }),
    supabase
      .from("outreach")
      .select(select)
      .eq("kind", "message")
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
    supabase
      .from("outreach")
      .select(select)
      .eq("kind", "message")
      .in("status", ["sent", "approved"])
      .lte("follow_up_at", today)
      .order("follow_up_at", { ascending: true }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Outreach</h1>
        <p className="text-sm text-zinc-500">
          Message drafts → approve → send (manual). Invites live on Today.
        </p>
      </div>
      <OutreachQueue
        drafts={(drafts || []) as never}
        approved={(approved || []) as never}
        followUps={(followUps || []) as never}
      />
    </div>
  );
}
