"use client";

import Link from "next/link";
import {
  ArrowRight,
  LogIn,
  LogOut,
  BedDouble,
  TrendingUp,
  Plus,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMAD } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import type { Reservation, Room } from "@/types";

type DashboardContentProps = {
  checkInsToday: Partial<Reservation>[];
  checkOutsToday: Partial<Reservation>[];
  rooms: Partial<Room>[];
  recentReservations: Partial<Reservation>[];
  occupancyRate: number;
  occupiedCount: number;
  totalRooms: number;
  revenueToday: number;
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmée", className: "bg-blue-100 text-blue-800" },
  checked_in: { label: "En séjour", className: "bg-emerald-100 text-emerald-800" },
  checked_out: { label: "Parti", className: "bg-stone-100 text-stone-600" },
  cancelled: { label: "Annulée", className: "bg-red-100 text-red-800" },
  no_show: { label: "No-show", className: "bg-red-100 text-red-800" },
};

export function DashboardContent({
  checkInsToday,
  checkOutsToday,
  rooms,
  recentReservations,
  occupancyRate,
  occupiedCount,
  totalRooms,
  revenueToday,
}: DashboardContentProps) {
  const availableRooms = totalRooms - occupiedCount;
  const maintenanceRooms = rooms.filter((r) => r.status === "maintenance").length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Arrivées aujourd'hui"
          value={checkInsToday.length}
          icon={<LogIn size={20} className="text-blue-500" />}
          color="blue"
          href="/reservations?filter=checkin_today"
        />
        <KpiCard
          label="Départs aujourd'hui"
          value={checkOutsToday.length}
          icon={<LogOut size={20} className="text-amber-500" />}
          color="amber"
          href="/reservations?filter=checkout_today"
        />
        <KpiCard
          label="Taux d'occupation"
          value={`${occupancyRate}%`}
          subtitle={`${occupiedCount}/${totalRooms} chambres`}
          icon={<BedDouble size={20} className="text-teal-500" />}
          color="teal"
          href="/calendar"
        />
        <KpiCard
          label="Recettes du jour"
          value={formatMAD(revenueToday)}
          icon={<TrendingUp size={20} className="text-emerald-500" />}
          color="emerald"
          href="/finances"
        />
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arrivals */}
        <SectionCard
          title="Arrivées"
          count={checkInsToday.length}
          href="/reservations?filter=checkin_today"
          emptyMessage="Aucune arrivée prévue aujourd'hui"
          emptyIcon={<LogIn size={32} className="text-stone-300" />}
        >
          {checkInsToday.map((r) => (
            <ReservationRow key={r.id} reservation={r} />
          ))}
        </SectionCard>

        {/* Departures */}
        <SectionCard
          title="Départs"
          count={checkOutsToday.length}
          href="/reservations?filter=checkout_today"
          emptyMessage="Aucun départ prévu aujourd'hui"
          emptyIcon={<LogOut size={32} className="text-stone-300" />}
        >
          {checkOutsToday.map((r) => (
            <ReservationRow key={r.id} reservation={r} />
          ))}
        </SectionCard>
      </div>

      {/* Room status overview */}
      <div className="hp-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-stone-900">
            État des chambres
          </h2>
          <Link href="/rooms">
            <Button variant="ghost" size="sm" className="text-teal-600 h-8 text-xs">
              Gérer <ArrowRight size={13} className="ml-1" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <RoomStat
            label="Disponibles"
            value={availableRooms}
            color="bg-emerald-100 text-emerald-700"
          />
          <RoomStat
            label="Occupées"
            value={occupiedCount}
            color="bg-blue-100 text-blue-700"
          />
          <RoomStat
            label="Maintenance"
            value={maintenanceRooms}
            color="bg-red-100 text-red-700"
          />
        </div>
      </div>

      {/* Recent reservations */}
      <div className="hp-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-stone-900">
            Réservations récentes
          </h2>
          <div className="flex items-center gap-2">
            <Link href="/reservations/new">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs">
                <Plus size={13} className="mr-1" />
                Nouvelle
              </Button>
            </Link>
            <Link href="/reservations">
              <Button variant="ghost" size="sm" className="text-teal-600 h-8 text-xs">
                Voir tout <ArrowRight size={13} className="ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {recentReservations.length === 0 ? (
          <div className="text-center py-8">
            <Clock size={40} className="text-stone-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-stone-500">Aucune réservation</p>
            <p className="text-xs text-stone-400 mt-1">
              Créez votre première réservation pour commencer
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentReservations.map((r) => (
              <Link
                key={r.id}
                href={`/reservations/${r.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-stone-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-mono font-medium text-teal-700">
                      {r.confirmation_code?.split("-")[1]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      {(r.guest as { first_name: string; last_name: string })?.first_name}{" "}
                      {(r.guest as { first_name: string; last_name: string })?.last_name}
                    </p>
                    <p className="text-xs text-stone-400">
                      {r.check_in_date && formatDate(r.check_in_date)} →{" "}
                      {r.check_out_date && formatDate(r.check_out_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {r.status && STATUS_BADGE[r.status] && (
                    <span
                      className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status].className}`}
                    >
                      {STATUS_BADGE[r.status].label}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Sub-components ----

function KpiCard({
  label,
  value,
  subtitle,
  icon,
  color,
  href,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  href: string;
}) {
  return (
    <Link href={href} className="hp-card p-5 hover:shadow-card-hover transition-all hover:scale-[1.01] block">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-stone-500 mb-1">{label}</p>
          <p className="text-2xl font-heading font-bold text-stone-900 truncate">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
          ${color === "blue" ? "bg-blue-50" : ""}
          ${color === "amber" ? "bg-amber-50" : ""}
          ${color === "teal" ? "bg-teal-50" : ""}
          ${color === "emerald" ? "bg-emerald-50" : ""}
        `}
        >
          {icon}
        </div>
      </div>
    </Link>
  );
}

function SectionCard({
  title,
  count,
  href,
  emptyMessage,
  emptyIcon,
  children,
}: {
  title: string;
  count: number;
  href: string;
  emptyMessage: string;
  emptyIcon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="hp-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-heading font-semibold text-stone-900">{title}</h2>
          {count > 0 && (
            <span className="bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        <Link href={href}>
          <Button variant="ghost" size="sm" className="text-teal-600 h-8 text-xs">
            Voir tout <ArrowRight size={13} className="ml-1" />
          </Button>
        </Link>
      </div>

      {count === 0 ? (
        <div className="text-center py-6">
          <div className="mb-2 flex justify-center">{emptyIcon}</div>
          <p className="text-sm text-stone-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}

function ReservationRow({ reservation: r }: { reservation: Partial<Reservation> }) {
  const rooms = (r as { reservation_rooms?: { room?: { name: string } }[] })
    .reservation_rooms;
  const roomName = rooms?.[0]?.room?.name;

  return (
    <Link
      href={`/reservations/${r.id}`}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-stone-50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center">
          <span className="text-xs font-semibold text-stone-600">
            {(r.guest as { first_name: string })?.first_name?.charAt(0)?.toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-stone-900">
            {(r.guest as { first_name: string; last_name: string })?.first_name}{" "}
            {(r.guest as { first_name: string; last_name: string })?.last_name}
          </p>
          {roomName && (
            <p className="text-xs text-stone-400">{roomName}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {r.status && STATUS_BADGE[r.status] && (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status].className}`}
          >
            {STATUS_BADGE[r.status].label}
          </span>
        )}
        <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500 transition-colors" />
      </div>
    </Link>
  );
}

function RoomStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`rounded-xl p-4 ${color.split(" ").map((c) => c.replace("text-", "bg-").replace("-700", "-50").replace("-800", "-50")).join(" ")} text-center`}>
      <p className={`text-2xl font-heading font-bold ${color.split(" ")[1]}`}>
        {value}
      </p>
      <p className={`text-xs font-medium ${color.split(" ")[1]} mt-0.5 opacity-80`}>
        {label}
      </p>
    </div>
  );
}
