import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { ReservationsList } from "@/components/reservations/ReservationsList";

export const dynamic = "force-dynamic";

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const { filter } = await searchParams;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) redirect("/onboarding");

  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("reservations")
    .select(
      "*, guest:guests(first_name, last_name, phone, email), reservation_rooms(rate_per_night, room:rooms(name, room_number))"
    )
    .eq("organization_id", profile.organization_id)
    .order("check_in_date", { ascending: false });

  if (filter === "checkin_today") {
    query = query.eq("check_in_date", today).in("status", ["confirmed", "checked_in"]);
  } else if (filter === "checkout_today") {
    query = query.eq("check_out_date", today).eq("status", "checked_in");
  } else if (filter === "active") {
    query = query.in("status", ["confirmed", "checked_in"]);
  }

  const { data: reservations } = await query.limit(50);

  return (
    <>
      <TopBar title="Réservations" />
      <main className="p-4 lg:p-6">
        <ReservationsList
          reservations={reservations || []}
          activeFilter={filter || "all"}
        />
      </main>
    </>
  );
}
