import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { GuestsList } from "@/components/guests/GuestsList";

export const dynamic = "force-dynamic";

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) redirect("/onboarding");

  let query = supabase
    .from("guests")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("last_name");

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  const { data: guests } = await query.limit(50);

  return (
    <>
      <TopBar title="Clients" />
      <main className="p-4 lg:p-6">
        <GuestsList guests={guests || []} searchQuery={q || ""} />
      </main>
    </>
  );
}
