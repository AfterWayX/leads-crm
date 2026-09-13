import { createClient } from "@/lib/supabase/server";
import {
  DailyBatch,
  type TodayInviteRow,
  type TodayMessageRow,
} from "@/components/today/daily-batch";
import { emptyCapacity, normalizeCapacity } from "@/lib/invites";
import type { InviteCapacity } from "@/types/crm";

export default async function TodayPage() {
  const supabase = await createClient();
  const select =
    "*, companies(name, score, temperature), contacts(name, linkedin_url, linkedin_verified)";

  const [
    { data: capacityRaw },
    { data: queued },
    { data: pending },
    { data: messageDrafts },
  ] = await Promise.all([
    supabase.rpc("invite_capacity"),
    supabase
      .from("outreach")
      .select(select)
      .eq("kind", "invite")
      .eq("status", "queued")
      .order("created_at", { ascending: true }),
    supabase
      .from("outreach")
      .select(select)
      .eq("kind", "invite")
      .eq("status", "pending")
      .order("sent_at", { ascending: true }),
    supabase
      .from("outreach")
      .select(
        "*, companies(name), contacts(name, linkedin_url)"
      )
      .eq("kind", "message")
      .in("status", ["draft", "approved"])
      .order("created_at", { ascending: false }),
  ]);

  const capacity: InviteCapacity = capacityRaw
    ? normalizeCapacity(capacityRaw)
    : emptyCapacity();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <p className="text-sm text-zinc-500">
          Daily 10 LinkedIn invites · then short DMs after they accept.
        </p>
      </div>
      <DailyBatch
        capacity={capacity}
        queued={(queued || []) as TodayInviteRow[]}
        pending={(pending || []) as TodayInviteRow[]}
        messageDrafts={(messageDrafts || []) as TodayMessageRow[]}
      />
    </div>
  );
}
