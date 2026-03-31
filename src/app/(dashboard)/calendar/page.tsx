import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { AvailabilityCalendar } from "@/components/calendar/AvailabilityCalendar";
import { format, startOfMonth, endOfMonth, addDays } from "date-fns";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { month, year } = await searchParams;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) redirect("/onboarding");

  const now = new Date();
  const targetDate = new Date(
    parseInt(year || String(now.getFullYear())),
    parseInt(month || String(now.getMonth()))
  );

  const rangeStart = format(startOfMonth(targetDate), "yyyy-MM-dd");
  const rangeEnd = format(addDays(endOfMonth(targetDate), 1), "yyyy-MM-dd");

  const [{ data: rooms }, { data: reservations }] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, name, room_number, type, base_price, status")
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("reservations")
      .select(
        "id, confirmation_code, status, check_in_date, check_out_date, guest:guests(first_name, last_name), reservation_rooms(room_id)"
      )
      .eq("organization_id", profile.organization_id)
      .in("status", ["confirmed", "checked_in", "pending"])
      .lt("check_in_date", rangeEnd)
      .gt("check_out_date", rangeStart),
  ]);

  return (
    <>
      <TopBar title="Calendrier" />
      <main className="p-4 lg:p-6 overflow-x-auto">
        <AvailabilityCalendar
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rooms={(rooms || []) as any[]}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          reservations={(reservations || []) as any[]}
          currentMonth={targetDate.getMonth()}
          currentYear={targetDate.getFullYear()}
        />
      </main>
    </>
  );
}
