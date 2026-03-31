"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMAD } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import type { Reservation } from "@/types";

type ReservationsListProps = {
  reservations: Partial<Reservation>[];
  activeFilter: string;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmée", className: "bg-blue-100 text-blue-800" },
  checked_in: { label: "En séjour", className: "bg-emerald-100 text-emerald-800" },
  checked_out: { label: "Parti", className: "bg-stone-100 text-stone-600" },
  cancelled: { label: "Annulée", className: "bg-red-100 text-red-800" },
  no_show: { label: "No-show", className: "bg-red-100 text-red-700" },
};

const FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "active", label: "Actives" },
  { value: "checkin_today", label: "Arrivées" },
  { value: "checkout_today", label: "Départs" },
];

export function ReservationsList({
  reservations,
  activeFilter,
}: ReservationsListProps) {
  const router = useRouter();

  function setFilter(f: string) {
    const params = new URLSearchParams();
    if (f !== "all") params.set("filter", f);
    router.push(`/reservations?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex bg-stone-100 rounded-xl p-1 gap-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                ${activeFilter === f.value
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Link href="/reservations/new">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus size={16} className="mr-2" />
            Nouvelle
          </Button>
        </Link>
      </div>

      {reservations.length === 0 ? (
        <EmptyReservations />
      ) : (
        <>
          <p className="text-sm text-stone-500">
            {reservations.length} réservation{reservations.length !== 1 ? "s" : ""}
          </p>

          {/* Desktop table */}
          <div className="hp-card hidden md:block overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-stone-100">
                <tr>
                  <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Réf.</th>
                  <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Client</th>
                  <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Chambre</th>
                  <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Arrivée</th>
                  <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Départ</th>
                  <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Montant</th>
                  <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Statut</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {reservations.map((r) => {
                  const guest = r.guest as { first_name: string; last_name: string } | undefined;
                  const rooms = (r as { reservation_rooms?: { room?: { name: string } }[] }).reservation_rooms;
                  const roomName = rooms?.[0]?.room?.name;

                  return (
                    <tr key={r.id} className="hover:bg-stone-50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded-md">
                          {r.confirmation_code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-stone-900">
                          {guest?.first_name} {guest?.last_name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-stone-600">{roomName || "—"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-stone-600">
                          {r.check_in_date && formatDate(r.check_in_date)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-stone-600">
                          {r.check_out_date && formatDate(r.check_out_date)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-stone-900">
                          {r.total_amount !== undefined && formatMAD(r.total_amount)}
                        </p>
                        {(r.balance_due || 0) > 0 && (
                          <p className="text-xs text-red-500">
                            Reste: {formatMAD(r.balance_due || 0)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {r.status && STATUS_CONFIG[r.status] && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[r.status].className}`}>
                            {STATUS_CONFIG[r.status].label}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/reservations/${r.id}`}>
                          <ArrowRight size={16} className="text-stone-300 group-hover:text-teal-600 transition-colors" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {reservations.map((r) => {
              const guest = r.guest as { first_name: string; last_name: string } | undefined;
              const rooms = (r as { reservation_rooms?: { room?: { name: string } }[] }).reservation_rooms;
              const roomName = rooms?.[0]?.room?.name;

              return (
                <Link
                  key={r.id}
                  href={`/reservations/${r.id}`}
                  className="hp-card p-4 block hover:shadow-card-hover transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-mono text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                        {r.confirmation_code}
                      </span>
                      <p className="font-medium text-stone-900 text-sm mt-1">
                        {guest?.first_name} {guest?.last_name}
                      </p>
                    </div>
                    {r.status && STATUS_CONFIG[r.status] && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[r.status].className}`}>
                        {STATUS_CONFIG[r.status].label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>{roomName}</span>
                    <span>{r.check_in_date && formatDate(r.check_in_date)} → {r.check_out_date && formatDate(r.check_out_date)}</span>
                    <span className="font-medium text-stone-900">{r.total_amount !== undefined && formatMAD(r.total_amount)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyReservations() {
  return (
    <div className="hp-card p-12 text-center">
      <BookOpen size={48} className="text-stone-200 mx-auto mb-4" />
      <h3 className="text-lg font-heading font-semibold text-stone-700 mb-2">
        Pas encore de réservations
      </h3>
      <p className="text-sm text-stone-400 mb-6 max-w-sm mx-auto">
        Créez votre première réservation pour commencer.
      </p>
      <Link href="/reservations/new">
        <Button className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus size={16} className="mr-2" />
          Nouvelle réservation
        </Button>
      </Link>
    </div>
  );
}
