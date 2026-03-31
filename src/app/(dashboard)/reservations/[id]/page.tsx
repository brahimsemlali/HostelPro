import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { ReservationDetail } from "@/components/reservations/ReservationDetail";

export const dynamic = "force-dynamic";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) redirect("/onboarding");

  const { data: reservation } = await supabase
    .from("reservations")
    .select(
      `*,
      guest:guests(*),
      reservation_rooms(*, room:rooms(*), bed:beds(*)),
      payments(*)`
    )
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (!reservation) notFound();

  return (
    <>
      <TopBar title={`Réservation ${reservation.confirmation_code}`} />
      <main className="p-4 lg:p-6">
        <ReservationDetail reservation={reservation} />
      </main>
    </>
  );
}
