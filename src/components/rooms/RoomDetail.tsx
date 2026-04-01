"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BedDouble,
  Tag,
  ArrowRight,
  Edit,
  Wrench,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { updateRoomStatus } from "@/lib/actions/rooms";
import { RoomFormDialog } from "./RoomFormDialog";
import { Button } from "@/components/ui/button";
import { formatMAD } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { ROOM_TYPE_LABELS } from "@/lib/constants/room-types";
import type { Room, Reservation, Guest, Floor } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmée", className: "bg-blue-100 text-blue-800" },
  checked_in: { label: "En séjour", className: "bg-emerald-100 text-emerald-800" },
  checked_out: { label: "Parti", className: "bg-stone-100 text-stone-600" },
  cancelled: { label: "Annulée", className: "bg-red-100 text-red-800" },
};

const ROOM_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  active: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
  maintenance: { label: "Maintenance", className: "bg-red-100 text-red-700" },
  blocked: { label: "Bloquée", className: "bg-stone-200 text-stone-600" },
  retired: { label: "Retirée", className: "bg-stone-100 text-stone-400" },
};

type RoomDetailProps = {
  room: Partial<Room> & { floor?: Partial<Floor> | null };
  reservations: Array<
    Partial<Reservation> & { guest?: Partial<Guest> }
  >;
};

export function RoomDetail({ room, reservations }: RoomDetailProps) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(false);

  const roomStatus = room.status || "active";
  const statusCfg =
    ROOM_STATUS_CONFIG[roomStatus] || ROOM_STATUS_CONFIG.active;

  async function toggleMaintenance() {
    if (!room.id) return;
    setLoading(true);
    try {
      const newStatus = roomStatus === "maintenance" ? "active" : "maintenance";
      await updateRoomStatus(room.id, newStatus);
      toast.success(
        newStatus === "maintenance"
          ? "Chambre mise en maintenance"
          : "Chambre remise en service"
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function toggleBlocked() {
    if (!room.id) return;
    setLoading(true);
    try {
      const newStatus = roomStatus === "blocked" ? "active" : "blocked";
      await updateRoomStatus(room.id, newStatus);
      toast.success(
        newStatus === "blocked" ? "Chambre bloquée" : "Chambre débloquée"
      );
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
        <ArrowLeft size={16} className="mr-2" /> Chambres
      </Button>

      {/* Header */}
      <div className="hp-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-heading font-semibold text-stone-900">
                {room.name}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}
              >
                {statusCfg.label}
              </span>
            </div>
            <p className="text-sm text-stone-400">
              Chambre #{room.room_number}
              {room.floor?.name ? ` · Étage: ${room.floor.name}` : ""}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
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
              disabled={loading}
              onClick={toggleMaintenance}
              className={
                roomStatus === "maintenance"
                  ? "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  : "text-amber-600 border-amber-200 hover:bg-amber-50"
              }
            >
              {roomStatus === "maintenance" ? (
                <>
                  <CheckCircle size={14} className="mr-1.5" /> Remettre en service
                </>
              ) : (
                <>
                  <Wrench size={14} className="mr-1.5" /> Maintenance
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={toggleBlocked}
              className={
                roomStatus === "blocked"
                  ? "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  : "text-stone-600"
              }
            >
              {roomStatus === "blocked" ? (
                <>
                  <CheckCircle size={14} className="mr-1.5" /> Débloquer
                </>
              ) : (
                <>
                  <XCircle size={14} className="mr-1.5" /> Bloquer
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Room details grid */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-stone-100">
          <div className="text-center">
            <p className="text-2xl font-heading font-bold text-teal-700">
              {formatMAD(room.base_price || 0)}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">par nuit</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-heading font-bold text-stone-900">
              {room.max_occupancy || "—"}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">personnes max</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-heading font-bold text-stone-900">
              {room.bed_count || "—"}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              lit{(room.bed_count || 0) !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-stone-100 space-y-3">
          <div className="flex items-center gap-3">
            <BedDouble size={15} className="text-stone-400" />
            <span className="text-sm text-stone-700">
              {ROOM_TYPE_LABELS[room.type || "private_double"]}
            </span>
          </div>
          {room.amenities && room.amenities.length > 0 && (
            <div className="flex items-start gap-3">
              <Tag size={15} className="text-stone-400 mt-0.5 flex-shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {room.amenities.map((a) => (
                  <span
                    key={a}
                    className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
          {room.description && (
            <p className="text-sm text-stone-500 italic">{room.description}</p>
          )}
        </div>
      </div>

      {/* Reservations */}
      <div className="hp-card p-6">
        <h2 className="font-heading font-semibold text-stone-900 mb-4">
          Réservations récentes
        </h2>
        {reservations.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-6">
            Aucune réservation pour cette chambre.
          </p>
        ) : (
          <div className="space-y-2">
            {reservations.map((r) => {
              const sc = STATUS_CONFIG[r.status || "confirmed"];
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
                        {r.guest?.first_name} {r.guest?.last_name}
                      </p>
                      <p className="text-xs text-stone-400">
                        {r.check_in_date && formatDate(r.check_in_date)} →{" "}
                        {r.check_out_date && formatDate(r.check_out_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {sc && (
                      <span
                        className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.className}`}
                      >
                        {sc.label}
                      </span>
                    )}
                    <span className="text-sm font-medium text-stone-700">
                      {r.total_amount !== undefined &&
                        formatMAD(r.total_amount)}
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

      <RoomFormDialog
        open={showEdit}
        onClose={() => {
          setShowEdit(false);
          router.refresh();
        }}
        floors={[]}
        editRoom={room.id ? { ...room, id: room.id } : undefined}
      />
    </div>
  );
}
