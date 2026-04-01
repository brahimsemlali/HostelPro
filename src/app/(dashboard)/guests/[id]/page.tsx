import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { GuestProfile } from "@/components/guests/GuestProfile";

export const dynamic = "force-dynamic";

export default async function GuestDetailPage({
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

  const { data: guest } = await supabase
    .from("guests")
    .select("*")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (!guest) notFound();

  // Fetch this guest's reservations
  const { data: reservations } = await supabase
    .from("reservations")
    .select(
      "id, confirmation_code, status, check_in_date, check_out_date, total_amount, nights, reservation_rooms(room:rooms(name))"
    )
    .eq("guest_id", id)
    .eq("organization_id", profile.organization_id)
    .order("check_in_date", { ascending: false })
    .limit(20);

  return (
    <>
      <TopBar title={`${guest.first_name} ${guest.last_name}`} />
      <main className="p-4 lg:p-6">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <GuestProfile guest={guest as any} reservations={(reservations || []) as any[]} />
      </main>
    </>
  );
}
