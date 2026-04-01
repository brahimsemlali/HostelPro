import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { RoomDetail } from "@/components/rooms/RoomDetail";

export const dynamic = "force-dynamic";

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) redirect("/onboarding");

  const { data: room } = await supabase
    .from("rooms")
    .select("*, floor:floors(id, name)")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (!room) notFound();

  // Step 1: get reservation IDs linked to this room
  const { data: rrLinks } = await supabase
    .from("reservation_rooms")
    .select("reservation_id")
    .eq("room_id", id);

  const reservationIds = (rrLinks || []).map((x) => x.reservation_id);

  // Step 2: fetch those reservations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reservations: any[] = [];
  if (reservationIds.length > 0) {
    const { data } = await supabase
      .from("reservations")
      .select(
        "id, confirmation_code, status, check_in_date, check_out_date, total_amount, guest:guests(first_name, last_name)"
      )
      .eq("organization_id", profile.organization_id)
      .in("id", reservationIds)
      .order("check_in_date", { ascending: false })
      .limit(10);
    reservations = (data || []) as unknown as typeof reservations;
  }

  return (
    <>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <TopBar title={(room as any).name} />
      <main className="p-4 lg:p-6">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <RoomDetail room={room as any} reservations={reservations} />
      </main>
    </>
  );
}
