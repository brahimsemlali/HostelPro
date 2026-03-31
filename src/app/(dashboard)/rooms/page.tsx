import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { RoomsGrid } from "@/components/rooms/RoomsGrid";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) redirect("/onboarding");

  const [{ data: rooms }, { data: floors }] = await Promise.all([
    supabase
      .from("rooms")
      .select("*, floor:floors(id, name)")
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("floors")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("sort_order"),
  ]);

  return (
    <>
      <TopBar title="Chambres & Lits" />
      <main className="p-4 lg:p-6">
        <RoomsGrid rooms={rooms || []} floors={floors || []} />
      </main>
    </>
  );
}
