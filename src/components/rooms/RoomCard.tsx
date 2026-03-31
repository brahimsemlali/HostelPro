"use client";

import { useState } from "react";
import { MoreVertical, Edit, Wrench, Lock, CheckCircle } from "lucide-react";
import { updateRoomStatus } from "@/lib/actions/rooms";
import { toast } from "sonner";
import { formatMAD } from "@/lib/utils/currency";
import { ROOM_TYPE_LABELS } from "@/lib/constants/room-types";
import type { Room } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type RoomCardProps = {
  room: Partial<Room>;
};

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; badge: string; label: string }
> = {
  active: {
    bg: "bg-white",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Active",
  },
  maintenance: {
    bg: "bg-red-50",
    text: "text-red-700",
    badge: "bg-red-100 text-red-700",
    label: "Maintenance",
  },
  blocked: {
    bg: "bg-stone-50",
    text: "text-stone-600",
    badge: "bg-stone-100 text-stone-600",
    label: "Bloquée",
  },
  retired: {
    bg: "bg-stone-50",
    text: "text-stone-400",
    badge: "bg-stone-100 text-stone-400",
    label: "Retirée",
  },
};

export function RoomCard({ room }: RoomCardProps) {
  const [loading, setLoading] = useState(false);
  const status = room.status || "active";
  const styles = STATUS_STYLES[status] || STATUS_STYLES.active;

  async function handleStatusChange(
    newStatus: "active" | "maintenance" | "blocked"
  ) {
    if (!room.id) return;
    setLoading(true);
    try {
      await updateRoomStatus(room.id, newStatus);
      toast.success(`Chambre mise à jour`);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`hp-card overflow-hidden transition-all hover:shadow-card-hover ${styles.bg}`}
    >
      {/* Top colored bar */}
      <div
        className={`h-1.5 ${
          status === "active"
            ? "bg-emerald-400"
            : status === "maintenance"
            ? "bg-red-400"
            : "bg-stone-300"
        }`}
      />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <p className="font-heading font-semibold text-stone-900 truncate">
              {room.name}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              #{room.room_number} ·{" "}
              {ROOM_TYPE_LABELS[room.type || "private_single"]}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-700 flex-shrink-0"
              disabled={loading}
            >
              <MoreVertical size={15} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => window.location.href = `/rooms/${room.id}`}>
                <Edit size={14} className="mr-2" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {status !== "active" && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange("active")}
                  className="text-emerald-700"
                >
                  <CheckCircle size={14} className="mr-2" /> Marquer active
                </DropdownMenuItem>
              )}
              {status !== "maintenance" && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange("maintenance")}
                  className="text-red-600"
                >
                  <Wrench size={14} className="mr-2" /> En maintenance
                </DropdownMenuItem>
              )}
              {status !== "blocked" && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange("blocked")}
                  className="text-stone-600"
                >
                  <Lock size={14} className="mr-2" /> Bloquer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-heading font-bold text-stone-900">
              {formatMAD(room.base_price || 0)}
            </p>
            <p className="text-xs text-stone-400">par nuit</p>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles.badge}`}
          >
            {styles.label}
          </span>
        </div>

        {room.amenities && room.amenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {room.amenities.slice(0, 3).map((a) => (
              <span
                key={a}
                className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded"
              >
                {a}
              </span>
            ))}
            {room.amenities.length > 3 && (
              <span className="text-[10px] text-stone-400">
                +{room.amenities.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
