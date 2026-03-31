"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  parseISO,
  isToday,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { Room, Reservation } from "@/types";

type CalendarReservation = Partial<Reservation> & {
  guest?: { first_name: string; last_name: string };
  reservation_rooms?: { room_id: string }[];
};

type AvailabilityCalendarProps = {
  rooms: Partial<Room>[];
  reservations: CalendarReservation[];
  currentMonth: number;
  currentYear: number;
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-400",
  checked_in: "bg-emerald-500",
  pending: "bg-yellow-400",
};

export function AvailabilityCalendar({
  rooms,
  reservations,
  currentMonth,
  currentYear,
}: AvailabilityCalendarProps) {
  const router = useRouter();
  const currentDate = new Date(currentYear, currentMonth);

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  function navigate(direction: "prev" | "next") {
    const newDate = new Date(currentYear, currentMonth + (direction === "next" ? 1 : -1));
    router.push(
      `/calendar?month=${newDate.getMonth()}&year=${newDate.getFullYear()}`
    );
  }

  // Build a map: roomId -> Set of occupied dates with reservation info
  const roomReservations = new Map<
    string,
    Array<{
      dates: Set<string>;
      reservation: CalendarReservation;
    }>
  >();

  for (const res of reservations) {
    if (!res.check_in_date || !res.check_out_date) continue;
    const resRooms = res.reservation_rooms || [];

    for (const rr of resRooms) {
      if (!roomReservations.has(rr.room_id)) {
        roomReservations.set(rr.room_id, []);
      }

      const occupiedDates = new Set<string>();
      const checkIn = parseISO(res.check_in_date);
      const checkOut = parseISO(res.check_out_date);

      const interval = eachDayOfInterval({ start: checkIn, end: checkOut }).slice(
        0,
        -1 // Exclude checkout day
      );

      for (const day of interval) {
        occupiedDates.add(format(day, "yyyy-MM-dd"));
      }

      roomReservations.get(rr.room_id)!.push({
        dates: occupiedDates,
        reservation: res,
      });
    }
  }

  function getCellInfo(
    roomId: string,
    dateStr: string
  ): CalendarReservation | null {
    const resData = roomReservations.get(roomId) || [];
    for (const { dates, reservation } of resData) {
      if (dates.has(dateStr)) return reservation;
    }
    return null;
  }

  function isCheckIn(roomId: string, dateStr: string): boolean {
    return reservations.some(
      (r) =>
        r.check_in_date === dateStr &&
        (r.reservation_rooms || []).some((rr) => rr.room_id === roomId)
    );
  }

  function isCheckOut(roomId: string, dateStr: string): boolean {
    return reservations.some(
      (r) =>
        r.check_out_date === dateStr &&
        (r.reservation_rooms || []).some((rr) => rr.room_id === roomId)
    );
  }

  const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("prev")}
            className="h-9 w-9"
          >
            <ChevronLeft size={16} />
          </Button>
          <h2 className="font-heading font-semibold text-stone-900 text-lg capitalize w-48 text-center">
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("next")}
            className="h-9 w-9"
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const now = new Date();
              router.push(`/calendar?month=${now.getMonth()}&year=${now.getFullYear()}`);
            }}
            className="text-teal-600 text-sm"
          >
            Aujourd&apos;hui
          </Button>
        </div>
        <Link href="/reservations/new">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white" size="sm">
            <Plus size={14} className="mr-1" /> Réservation
          </Button>
        </Link>
      </div>

      {rooms.length === 0 ? (
        <div className="hp-card p-12 text-center">
          <p className="text-stone-400 text-sm">
            Aucune chambre configurée.{" "}
            <Link href="/rooms" className="text-teal-600 hover:underline">
              Ajouter des chambres
            </Link>
          </p>
        </div>
      ) : (
        <div className="hp-card overflow-x-auto">
          <table className="w-full" style={{ minWidth: `${Math.max(800, 200 + days.length * 40)}px` }}>
            {/* Day headers */}
            <thead>
              <tr>
                <th className="sticky left-0 bg-white z-10 w-36 min-w-[9rem] px-4 py-3 text-left border-b border-r border-stone-100">
                  <span className="text-xs font-medium text-stone-400">Chambre</span>
                </th>
                {days.map((day) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const todayCell = isToday(day);
                  return (
                    <th
                      key={dayStr}
                      className={`w-10 min-w-[2.5rem] px-0 py-2 text-center border-b border-stone-100
                        ${todayCell ? "bg-teal-50" : ""}`}
                    >
                      <p className={`text-xs font-medium ${todayCell ? "text-teal-600" : "text-stone-400"}`}>
                        {DAY_NAMES[(day.getDay() + 6) % 7]}
                      </p>
                      <p
                        className={`text-sm font-semibold mt-0.5
                        ${todayCell
                            ? "text-teal-700 bg-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto"
                            : "text-stone-700"
                          }`}
                      >
                        {format(day, "d")}
                      </p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} className="border-b border-stone-50 last:border-0">
                  <td className="sticky left-0 bg-white z-10 px-4 py-3 border-r border-stone-100">
                    <Link href={`/rooms/${room.id}`}>
                      <p className="text-sm font-medium text-stone-900 hover:text-teal-600 transition-colors truncate max-w-[8rem]">
                        {room.name}
                      </p>
                      <p className="text-xs text-stone-400">#{room.room_number}</p>
                    </Link>
                  </td>
                  {days.map((day) => {
                    const dayStr = format(day, "yyyy-MM-dd");
                    const todayCell = isToday(day);
                    const res = getCellInfo(room.id!, dayStr);
                    const isStart = res && isCheckIn(room.id!, dayStr);
                    const isEnd = res && isCheckOut(room.id!, format(day, "yyyy-MM-dd"));

                    if (res) {
                      const color = STATUS_COLORS[res.status || "confirmed"] || "bg-blue-400";
                      return (
                        <td
                          key={dayStr}
                          className={`px-0 py-2 h-12 relative ${todayCell ? "bg-teal-50/50" : ""}`}
                        >
                          <Link href={`/reservations/${res.id}`}>
                            <div
                              className={`h-7 mx-0.5 ${color} opacity-80 hover:opacity-100 transition-opacity
                                ${isStart ? "rounded-l-full ml-1" : ""}
                                ${isEnd ? "rounded-r-full mr-1" : ""}
                              `}
                              title={`${res.guest?.first_name} ${res.guest?.last_name} (${res.confirmation_code})`}
                            >
                              {isStart && (
                                <span className="text-white text-[10px] font-medium px-2 truncate block overflow-hidden whitespace-nowrap">
                                  {res.guest?.last_name}
                                </span>
                              )}
                            </div>
                          </Link>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={dayStr}
                        className={`px-0 py-2 h-12 ${todayCell ? "bg-teal-50/50" : "hover:bg-stone-50"} transition-colors`}
                      >
                        <div className="h-7 mx-0.5" />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-blue-400 rounded" />
          Confirmée
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-emerald-500 rounded" />
          En séjour
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-yellow-400 rounded" />
          En attente
        </span>
      </div>
    </div>
  );
}
