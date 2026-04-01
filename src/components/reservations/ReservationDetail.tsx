"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  BedDouble,
  Calendar,
  CreditCard,
  LogIn,
  LogOut,
  XCircle,
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { updateReservationStatus, cancelReservation } from "@/lib/actions/reservations";
import { AddPaymentDialog } from "@/components/finances/AddPaymentDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatMAD } from "@/lib/utils/currency";
import { formatDate, formatDateTime } from "@/lib/utils/dates";
import type { Reservation, Guest, Room, Payment } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmée", className: "bg-blue-100 text-blue-800" },
  checked_in: { label: "En séjour", className: "bg-emerald-100 text-emerald-800" },
  checked_out: { label: "Parti", className: "bg-stone-100 text-stone-600" },
  cancelled: { label: "Annulée", className: "bg-red-100 text-red-800" },
  no_show: { label: "No-show", className: "bg-red-100 text-red-700" },
};

const SOURCE_LABELS: Record<string, string> = {
  direct: "Direct", walk_in: "Sans réservation", booking_com: "Booking.com",
  hostelworld: "Hostelworld", airbnb: "Airbnb", whatsapp: "WhatsApp",
  phone: "Téléphone", website: "Site web", other: "Autre",
};

type ReservationDetailProps = {
  reservation: Partial<Reservation> & {
    guest?: Partial<Guest>;
    reservation_rooms?: Array<{ room?: Partial<Room>; rate_per_night: number }>;
    payments?: Partial<Payment>[];
  };
};

export function ReservationDetail({ reservation: r }: ReservationDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const status = r.status || "confirmed";
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.confirmed;
  const guest = r.guest;
  const rooms = r.reservation_rooms;
  const payments = r.payments || [];

  async function handleAction(
    action: "check_in" | "check_out" | "cancel"
  ) {
    if (!r.id) return;
    if (action === "cancel") {
      setShowCancelDialog(true);
      return;
    }
    setLoading(true);
    try {
      if (action === "check_in") {
        await updateReservationStatus(r.id, "checked_in");
        toast.success("Check-in effectué");
      } else {
        await updateReservationStatus(r.id, "checked_out");
        toast.success("Check-out effectué — tâche ménage créée");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!r.id) return;
    setLoading(true);
    try {
      await cancelReservation(r.id, cancelReason);
      toast.success("Réservation annulée");
      setShowCancelDialog(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
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
        <ArrowLeft size={16} className="mr-2" /> Réservations
      </Button>

      {/* Header */}
      <div className="hp-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-lg font-bold text-teal-700">
                {r.confirmation_code}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-sm text-stone-500">
              Source: {SOURCE_LABELS[r.source || "direct"]} · Créée le{" "}
              {r.created_at && formatDate(r.created_at)}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {status === "confirmed" && (
              <>
                <Button
                  onClick={() => handleAction("check_in")}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="sm"
                >
                  {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : <LogIn size={14} className="mr-1" />}
                  Check-in
                </Button>
                <Button
                  onClick={() => handleAction("cancel")}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle size={14} className="mr-1" /> Annuler
                </Button>
              </>
            )}
            {status === "checked_in" && (
              <Button
                onClick={() => handleAction("check_out")}
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-white"
                size="sm"
              >
                {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : <LogOut size={14} className="mr-1" />}
                Check-out
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Guest */}
      <div className="hp-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-teal-600" />
          <h2 className="font-heading font-semibold text-stone-900">Client</h2>
        </div>
        {guest ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-semibold text-teal-700">
                {guest.first_name?.charAt(0)}{guest.last_name?.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-semibold text-stone-900">
                {guest.first_name} {guest.last_name}
              </p>
              <p className="text-sm text-stone-500">
                {guest.phone || guest.email || guest.nationality || "—"}
              </p>
            </div>
            <Link href={`/guests/${guest.id}`} className="ml-auto">
              <Button variant="outline" size="sm">Profil</Button>
            </Link>
          </div>
        ) : (
          <p className="text-stone-400 text-sm">Client introuvable</p>
        )}
      </div>

      {/* Stay details */}
      <div className="hp-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-teal-600" />
          <h2 className="font-heading font-semibold text-stone-900">Séjour</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-stone-500 mb-0.5">Arrivée prévue</p>
            <p className="font-medium text-stone-900">
              {r.check_in_date && formatDate(r.check_in_date)}
            </p>
            {r.actual_check_in && (
              <p className="text-xs text-emerald-600 mt-0.5">
                Check-in réel: {formatDateTime(r.actual_check_in)}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-stone-500 mb-0.5">Départ prévu</p>
            <p className="font-medium text-stone-900">
              {r.check_out_date && formatDate(r.check_out_date)}
            </p>
            {r.actual_check_out && (
              <p className="text-xs text-stone-500 mt-0.5">
                Check-out réel: {formatDateTime(r.actual_check_out)}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-stone-500 mb-0.5">Durée</p>
            <p className="font-medium text-stone-900">{r.nights} nuit{(r.nights || 0) !== 1 ? "s" : ""}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500 mb-0.5">Voyageurs</p>
            <p className="font-medium text-stone-900">
              {r.adults} adulte{(r.adults || 0) !== 1 ? "s" : ""}
              {(r.children || 0) > 0 ? `, ${r.children} enfant${(r.children || 0) !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
        </div>

        {rooms && rooms.length > 0 && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <div className="flex items-center gap-2 mb-2">
              <BedDouble size={14} className="text-stone-400" />
              <p className="text-xs text-stone-500 font-medium">Chambres</p>
            </div>
            {rooms.map((rr, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <p className="text-sm text-stone-900">{rr.room?.name}</p>
                <p className="text-sm text-stone-600">{formatMAD(rr.rate_per_night)}/nuit</p>
              </div>
            ))}
          </div>
        )}

        {r.special_requests && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs text-stone-500 font-medium mb-1">Demandes spéciales</p>
            <p className="text-sm text-stone-700">{r.special_requests}</p>
          </div>
        )}
      </div>

      {/* Financial */}
      <div className="hp-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-teal-600" />
            <h2 className="font-heading font-semibold text-stone-900">Paiement</h2>
          </div>
          {(status === "confirmed" || status === "checked_in" || status === "checked_out") && (
            <Button size="sm" variant="outline" onClick={() => setShowPaymentDialog(true)}>
              <Plus size={14} className="mr-1" /> Paiement
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <p className="text-sm text-stone-500">Total du séjour</p>
            <p className="font-medium text-stone-900">{formatMAD(r.total_amount || 0)}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-stone-500">Montant reçu</p>
            <p className="font-medium text-emerald-700">{formatMAD(r.amount_paid || 0)}</p>
          </div>
          <div className="flex justify-between pt-3 border-t border-stone-100">
            <p className="text-sm font-semibold text-stone-900">Reste à payer</p>
            <p className={`font-bold ${(r.balance_due || 0) > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {formatMAD(r.balance_due || 0)}
            </p>
          </div>
        </div>

        {payments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs text-stone-500 font-medium mb-2">Historique des paiements</p>
            {payments.map((p) => (
              <div key={p.id} className="flex justify-between py-1.5 text-sm">
                <span className="text-stone-600 capitalize">{p.method}</span>
                <span className="font-medium">{formatMAD(p.amount || 0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Annuler la réservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-stone-600">
              Êtes-vous sûr de vouloir annuler cette réservation ?
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">
                Motif d&apos;annulation
              </label>
              <Textarea
                placeholder="Annulation client, force majeure..."
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                className="flex-1"
              >
                Retour
              </Button>
              <Button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Annuler la réservation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add payment dialog */}
      <AddPaymentDialog
        open={showPaymentDialog}
        onClose={() => {
          setShowPaymentDialog(false);
          router.refresh();
        }}
        prefilledReservationId={r.id}
      />
    </div>
  );
}
