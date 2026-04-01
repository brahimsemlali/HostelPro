import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { HousekeepingBoard } from "@/components/operations/HousekeepingBoard";

export const dynamic = "force-dynamic";

export default async function HousekeepingPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) redirect("/onboarding");
  const orgId = profile.organization_id;

  const [{ data: tasks }, { data: rooms }] = await Promise.all([
    supabase
      .from("housekeeping_tasks")
      .select("*, room:rooms(id, name, room_number, type)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("rooms")
      .select("id, name, room_number, type")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  return (
    <>
      <TopBar title="Ménage & Opérations" />
      <main className="p-4 lg:p-6">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <HousekeepingBoard tasks={(tasks || []) as any[]} rooms={(rooms || []) as any[]} />
      </main>
    </>
  );
}
