"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Plus,
  Users,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Accueil", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendrier", href: "/calendar", icon: CalendarDays },
  { label: "Réserver", href: "/reservations/new", icon: Plus, special: true },
  { label: "Clients", href: "/guests", icon: Users },
  { label: "Réservations", href: "/reservations", icon: BookOpen },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-200 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {TABS.map((tab) => {
          const active = pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href + "/"));

          if (tab.special) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg hover:bg-teal-700 transition-colors -mt-4">
                  <tab.icon size={22} className="text-white" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 text-center",
                active ? "text-teal-600" : "text-stone-400"
              )}
            >
              <tab.icon size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
