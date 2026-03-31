import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch today's data in parallel
  const [
    { data: checkInsToday },
    { data: checkOutsToday },
    { data: rooms },
    { data: recentReservations },
  ] = await Promise.all([
    supabase
      .from("reservations")
      .select("id, confirmation_code, status, guest:guests(first_name, last_name), reservation_rooms(room:rooms(name))")
      .eq("organization_id", orgId)
      .eq("check_in_date", today)
      .in("status", ["confirmed", "checked_in"]),
    supabase
      .from("reservations")
      .select("id, confirmation_code, status, guest:guests(first_name, last_name), reservation_rooms(room:rooms(name))")
      .eq("organization_id", orgId)
      .eq("check_out_date", today)
      .eq("status", "checked_in"),
    supabase
      .from("rooms")
      .select("id, name, status, type")
      .eq("organization_id", orgId)
      .eq("is_active", true),
    supabase
      .from("reservations")
      .select("id, confirmation_code, status, check_in_date, check_out_date, total_amount, guest:guests(first_name, last_name)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Calculate occupancy
  const { data: occupiedRooms } = await supabase
    .from("reservations")
    .select("reservation_rooms(room_id)")
    .eq("organization_id", orgId)
    .eq("status", "checked_in");

  const occupiedRoomIds = new Set(
    (occupiedRooms || []).flatMap((r) =>
      (r.reservation_rooms as { room_id: string }[]).map((rr) => rr.room_id)
    )
  );

  const totalRooms = (rooms || []).filter((r) => r.status === "active").length;
  const occupiedCount = (rooms || []).filter(
    (r) => r.status === "active" && occupiedRoomIds.has(r.id)
  ).length;
  const occupancyRate =
    totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  // Revenue today
  const { data: paymentsToday } = await supabase
    .from("payments")
    .select("amount")
    .eq("organization_id", orgId)
    .gte("payment_date", today + "T00:00:00")
    .lte("payment_date", today + "T23:59:59");

  const revenueToday = (paymentsToday || []).reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  return (
    <>
      <TopBar title="Tableau de bord" />
      <main className="p-4 lg:p-6 space-y-6">
        <DashboardContent
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          checkInsToday={(checkInsToday || []) as any[]}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          checkOutsToday={(checkOutsToday || []) as any[]}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rooms={(rooms || []) as any[]}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recentReservations={(recentReservations || []) as any[]}
          occupancyRate={occupancyRate}
          occupiedCount={occupiedCount}
          totalRooms={totalRooms}
          revenueToday={revenueToday}
        />
      </main>
    </>
  );
}
