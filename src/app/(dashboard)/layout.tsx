import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { OrganizationProvider } from "@/components/layout/OrganizationProvider";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile and organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("id", user.id)
    .maybeSingle();

  // If no profile/org yet, go to onboarding
  if (!profile || !profile.organization_id) {
    redirect("/onboarding");
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.organization_id)
    .single();

  return (
    <OrganizationProvider organization={organization} profile={profile}>
      <div className="min-h-screen bg-stone-50">
        <Sidebar />
        {/* Main content area */}
        <div className="lg:pl-64 pb-20 lg:pb-0 min-h-screen">
          {children}
        </div>
        <MobileNav />
        <Toaster richColors position="top-right" />
      </div>
    </OrganizationProvider>
  );
}
