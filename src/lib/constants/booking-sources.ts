import type { BookingSource } from "@/types";

export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
  direct: "Direct",
  walk_in: "Sans réservation",
  booking_com: "Booking.com",
  hostelworld: "Hostelworld",
  airbnb: "Airbnb",
  whatsapp: "WhatsApp",
  phone: "Téléphone",
  website: "Site web",
  other: "Autre",
};

export const BOOKING_SOURCE_COLORS: Record<BookingSource, string> = {
  direct: "emerald",
  walk_in: "stone",
  booking_com: "blue",
  hostelworld: "orange",
  airbnb: "red",
  whatsapp: "green",
  phone: "purple",
  website: "teal",
  other: "stone",
};
