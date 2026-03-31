"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/dates";

type TopBarProps = {
  title: string;
};

export function TopBar({ title }: TopBarProps) {
  const today = formatDate(new Date());

  return (
    <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-heading font-semibold text-stone-900">{title}</h1>
        <p className="text-xs text-stone-400 hidden sm:block">{today}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-stone-500 hover:text-stone-900">
          <Search size={18} />
        </Button>
        <Button variant="ghost" size="icon" className="text-stone-500 hover:text-stone-900 relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        </Button>
      </div>
    </header>
  );
}
