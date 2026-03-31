"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Users,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GuestFormDialog } from "./GuestFormDialog";
import { formatMAD } from "@/lib/utils/currency";
import type { Guest } from "@/types";

type GuestsListProps = {
  guests: Partial<Guest>[];
  searchQuery: string;
};

export function GuestsList({ guests, searchQuery }: GuestsListProps) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState(searchQuery);

  function handleSearch(value: string) {
    setSearch(value);
    const params = new URLSearchParams();
    if (value) params.set("q", value);
    router.push(`/guests?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <Input
            placeholder="Rechercher un client..."
            className="pl-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white flex-shrink-0"
        >
          <Plus size={16} className="mr-2" />
          Ajouter
        </Button>
      </div>

      {guests.length === 0 ? (
        <EmptyGuests
          hasSearch={!!searchQuery}
          onAdd={() => setShowAdd(true)}
        />
      ) : (
        <>
          <p className="text-sm text-stone-500">
            {guests.length} client{guests.length !== 1 ? "s" : ""}
          </p>

          {/* Desktop table */}
          <div className="hp-card hidden md:block overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-stone-100">
                <tr>
                  <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">
                    Client
                  </th>
                  <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">
                    Contact
                  </th>
                  <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">
                    Nationalité
                  </th>
                  <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">
                    Séjours
                  </th>
                  <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">
                    Dépenses
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {guests.map((guest) => (
                  <tr
                    key={guest.id}
                    className="hover:bg-stone-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-teal-700">
                            {guest.first_name?.charAt(0)?.toUpperCase()}
                            {guest.last_name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-stone-900 text-sm">
                            {guest.first_name} {guest.last_name}
                          </p>
                          {guest.tags && guest.tags.length > 0 && (
                            <div className="flex gap-1 mt-0.5">
                              {guest.tags.slice(0, 2).map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        {guest.phone && (
                          <p className="text-xs text-stone-600 flex items-center gap-1">
                            <Phone size={11} className="text-stone-400" />
                            {guest.phone}
                          </p>
                        )}
                        {guest.email && (
                          <p className="text-xs text-stone-600 flex items-center gap-1">
                            <Mail size={11} className="text-stone-400" />
                            {guest.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-600">{guest.nationality || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-900 font-medium">
                        {guest.total_stays || 0}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-stone-900">
                        {formatMAD(guest.total_spent || 0)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/guests/${guest.id}`}>
                        <ArrowRight
                          size={16}
                          className="text-stone-300 group-hover:text-teal-600 transition-colors"
                        />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {guests.map((guest) => (
              <Link
                key={guest.id}
                href={`/guests/${guest.id}`}
                className="hp-card p-4 flex items-center gap-3 hover:shadow-card-hover transition-all block"
              >
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-teal-700">
                    {guest.first_name?.charAt(0)?.toUpperCase()}
                    {guest.last_name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900 text-sm">
                    {guest.first_name} {guest.last_name}
                  </p>
                  <p className="text-xs text-stone-400 truncate">
                    {guest.phone || guest.email || guest.nationality || "Pas de contact"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-stone-900">
                    {guest.total_stays || 0} séjour{(guest.total_stays || 0) !== 1 ? "s" : ""}
                  </p>
                  <ArrowRight size={14} className="text-stone-300 ml-auto mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <GuestFormDialog open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}

function EmptyGuests({
  hasSearch,
  onAdd,
}: {
  hasSearch: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="hp-card p-12 text-center">
      <Users size={48} className="text-stone-200 mx-auto mb-4" />
      <h3 className="text-lg font-heading font-semibold text-stone-700 mb-2">
        {hasSearch ? "Aucun client trouvé" : "Pas encore de clients"}
      </h3>
      <p className="text-sm text-stone-400 mb-6 max-w-sm mx-auto">
        {hasSearch
          ? "Essayez une autre recherche ou modifiez les filtres."
          : "Ajoutez votre premier client pour commencer à gérer les réservations."}
      </p>
      {!hasSearch && (
        <Button
          onClick={onAdd}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus size={16} className="mr-2" />
          Ajouter un client
        </Button>
      )}
    </div>
  );
}
