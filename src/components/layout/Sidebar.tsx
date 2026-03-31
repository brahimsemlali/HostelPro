"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Users,
  DoorOpen,
  TrendingUp,
  Wrench,
  Settings,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/lib/hooks/useOrganization";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Calendrier",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    label: "Réservations",
    href: "/reservations",
    icon: BookOpen,
  },
  {
    label: "Clients",
    href: "/guests",
    icon: Users,
  },
  {
    label: "Chambres",
    href: "/rooms",
    icon: DoorOpen,
  },
  {
    label: "Finances",
    href: "/finances",
    icon: TrendingUp,
  },
  {
    label: "Opérations",
    href: "/operations/housekeeping",
    icon: Wrench,
    matchPrefix: "/operations",
  },
  {
    label: "Paramètres",
    href: "/settings",
    icon: Settings,
    matchPrefix: "/settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { organization, profile } = useOrganization();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-stone-200 min-h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-stone-100">
        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-heading font-semibold text-stone-900 truncate">
            {organization?.name || "HostelPro"}
          </p>
          <p className="text-xs text-stone-400 truncate">{organization?.city || ""}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active =
            item.matchPrefix
              ? pathname.startsWith(item.matchPrefix)
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-teal-50 text-teal-700"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              )}
            >
              <item.icon
                size={18}
                className={active ? "text-teal-600" : "text-stone-400"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-stone-100 p-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors">
          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-teal-700">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-stone-900 truncate">
              {profile?.full_name || "Utilisateur"}
            </p>
            <p className="text-xs text-stone-400 capitalize">{profile?.role || "owner"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-stone-400 hover:text-red-500 transition-colors p-1 rounded"
            title="Se déconnecter"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
