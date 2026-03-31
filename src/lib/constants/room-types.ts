import type { RoomType, RoomStatus, BedType } from "@/types";

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  private_single: "Chambre Simple",
  private_double: "Chambre Double",
  private_twin: "Chambre Twin",
  suite: "Suite",
  dorm: "Dortoir",
  camping: "Camping",
};

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  active: "Active",
  maintenance: "Maintenance",
  blocked: "Bloquée",
  retired: "Retirée",
};

export const BED_TYPE_LABELS: Record<BedType, string> = {
  single: "Lit Simple",
  bunk_top: "Lit Superposé (Haut)",
  bunk_bottom: "Lit Superposé (Bas)",
};

export const ROOM_AMENITIES = [
  { value: "wifi", label: "Wi-Fi" },
  { value: "ac", label: "Climatisation" },
  { value: "heating", label: "Chauffage" },
  { value: "private_bathroom", label: "Salle de bain privée" },
  { value: "balcony", label: "Balcon" },
  { value: "tv", label: "Télévision" },
  { value: "safe", label: "Coffre-fort" },
  { value: "minibar", label: "Minibar" },
  { value: "desk", label: "Bureau" },
  { value: "hairdryer", label: "Sèche-cheveux" },
];
