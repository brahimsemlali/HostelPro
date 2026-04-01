"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Globe,
  CreditCard,
  Calendar,
  Edit,
  Trash2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { deleteGuest } from "@/lib/actions/guests";
import { GuestFormDialog } from "./GuestFormDialog";
import { Button } from "@/components/ui/button";
import { formatMAD } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import type { Guest, Reservation, Room } from "@/types";

const ID_TYPE_LABELS: Record<string, string> = {
  passport: "Passeport",
  cin: "CIN",
  carte_sejour: "Carte de séjour",
  driving_license: "Permis de conduire",
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmée", className: "bg-blue-100 text-blue-800" },
  checked_in: { label: "En séjour", className: "bg-emerald-100 text-emerald-800" },
  checked_out: { label: "Parti", className: "bg-stone-100 text-stone-600" },
  cancelled: { label: "Annulée", className: "bg-red-100 text-red-800" },
  no_show: { label: "No-show", className: "bg-red-100 text-red-700" },
};

type GuestProfileProps = {
  guest: Partial<Guest>;
  reservations: Array<
    Partial<Reservation> & {
      reservation_rooms?: Array<{ room?: Partial<Room> }>;
    }
  >;
};

export function GuestProfile({ guest, reservations }: GuestProfileProps) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!guest.id) return;
    if (!confirm(`Supprimer ${guest.first_name} ${guest.last_name} ? Cette action est irréversible.`)) return;
    setDeleting(true);
    try {
      await deleteGuest(guest.id);
      toast.success("Client supprimé");
      router.push("/guests");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="text-stone-500 -ml-2"
      >
        <ArrowLeft size={16} className="mr-2" /> Clients
      </Button>

      {/* Header card */}
      <div className="hp-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-teal-700">
                {guest.first_name?.charAt(0)?.toUpperCase()}
                {guest.last_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-heading font-semibold text-stone-900">
                {guest.first_name} {guest.last_name}
              </h1>
              <p className="text-sm text-stone-500 mt-0.5">
                {guest.nationality || "Nationalité inconnue"}
              </p>
              {guest.tags && guest.tags.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {guest.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEdit(true)}
            >
              <Edit size={14} className="mr-1.5" /> Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {deleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-stone-100">
          <div className="text-center">
            <p className="text-2xl font-heading font-bold text-stone-900">
              {guest.total_stays || 0}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              Séjour{(guest.total_stays || 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-heading font-bold text-teal-700">
              {formatMAD(guest.total_spent || 0)}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">Total dépensé</p>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="hp-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-teal-600" />
          <h2 className="font-heading font-semibold text-stone-900">
            Informations personnelles
          </h2>
        </div>
        <div className="space-y-3">
          {guest.phone && (
            <div className="flex items-center gap-3">
              <Phone size={15} className="text-stone-400 flex-shrink-0" />
              <span className="text-sm text-stone-700">{guest.phone}</span>
            </div>
          )}
          {guest.email && (
            <div className="flex items-center gap-3">
              <Mail size={15} className="text-stone-400 flex-shrink-0" />
              <span className="text-sm text-stone-700">{guest.email}</span>
            </div>
          )}
          {guest.nationality && (
            <div className="flex items-center gap-3">
              <Globe size={15} className="text-stone-400 flex-shrink-0" />
              <span className="text-sm text-stone-700">{guest.nationality}</span>
            </div>
          )}
          {guest.date_of_birth && (
            <div className="flex items-center gap-3">
              <Calendar size={15} className="text-stone-400 flex-shrink-0" />
              <span className="text-sm text-stone-700">
                Né(e) le {formatDate(guest.date_of_birth)}
              </span>
            </div>
          )}
          {guest.id_type && guest.id_number && (
            <div className="flex items-center gap-3">
              <CreditCard size={15} className="text-stone-400 flex-shrink-0" />
              <span className="text-sm text-stone-700">
                {ID_TYPE_LABELS[guest.id_type] || guest.id_type} ·{" "}
                <span className="font-mono">{guest.id_number}</span>
              </span>
            </div>
          )}
          {guest.address && (
            <div className="flex items-start gap-3">
              <div className="w-[15px] flex-shrink-0 mt-0.5">
                <div className="w-3.5 h-3.5 border border-stone-300 rounded-sm" />
              </div>
              <span className="text-sm text-stone-700">{guest.address}</span>
            </div>
          )}
        </div>
        {guest.notes && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs font-medium text-stone-400 mb-1">Notes internes</p>
            <p className="text-sm text-stone-600 whitespace-pre-line">{guest.notes}</p>
          </div>
        )}
      </div>

      {/* Reservation history */}
      <div className="hp-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-teal-600" />
          <h2 className="font-heading font-semibold text-stone-900">
            Historique des séjours
          </h2>
        </div>

        {reservations.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-6">
            Aucun séjour enregistré pour ce client.
          </p>
        ) : (
          <div className="space-y-2">
            {reservations.map((r) => {
              const roomName = r.reservation_rooms?.[0]?.room?.name;
              const statusCfg = STATUS_CONFIG[r.status || "confirmed"];
              return (
                <Link
                  key={r.id}
                  href={`/reservations/${r.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-stone-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded">
                      {r.confirmation_code}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-stone-900">
                        {roomName || "Chambre"}
                      </p>
                      <p className="text-xs text-stone-400">
                        {r.check_in_date && formatDate(r.check_in_date)} →{" "}
                        {r.check_out_date && formatDate(r.check_out_date)}
                        {r.nights ? ` · ${r.nights} nuit${r.nights !== 1 ? "s" : ""}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusCfg && (
                      <span
                        className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}
                      >
                        {statusCfg.label}
                      </span>
                    )}
                    <span className="text-sm font-medium text-stone-700">
                      {r.total_amount !== undefined && formatMAD(r.total_amount)}
                    </span>
                    <ArrowRight
                      size={14}
                      className="text-stone-300 group-hover:text-stone-500 transition-colors"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <GuestFormDialog
        open={showEdit}
        onClose={() => {
          setShowEdit(false);
          router.refresh();
        }}
        guest={guest}
      />
    </div>
  );
}
