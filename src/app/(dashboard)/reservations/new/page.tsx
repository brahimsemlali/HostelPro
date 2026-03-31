import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { NewReservationForm } from "@/components/reservations/NewReservationForm";

export const dynamic = "force-dynamic";

export default async function NewReservationPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) redirect("/onboarding");

  const [{ data: guests }, { data: rooms }] = await Promise.all([
    supabase
      .from("guests")
      .select("id, first_name, last_name, phone, email")
      .eq("organization_id", profile.organization_id)
      .order("last_name"),
    supabase
      .from("rooms")
      .select("id, name, room_number, type, base_price, max_occupancy")
      .eq("organization_id", profile.organization_id)
      .eq("status", "active")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  return (
    <>
      <TopBar title="Nouvelle réservation" />
      <main className="p-4 lg:p-6">
        <NewReservationForm guests={guests || []} rooms={rooms || []} />
      </main>
    </>
  );
}
