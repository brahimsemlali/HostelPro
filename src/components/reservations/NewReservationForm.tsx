"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, CalendarDays, User, DollarSign, Plus } from "lucide-react";
import { toast } from "sonner";
import { createReservation } from "@/lib/actions/reservations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GuestFormDialog } from "@/components/guests/GuestFormDialog";
import { formatMAD } from "@/lib/utils/currency";
import { ROOM_TYPE_LABELS } from "@/lib/constants/room-types";
import { differenceInDays, parseISO } from "date-fns";
import type { Guest, Room } from "@/types";

const SOURCES = [
  { value: "direct", label: "Direct" },
  { value: "walk_in", label: "Sans réservation" },
  { value: "booking_com", label: "Booking.com" },
  { value: "hostelworld", label: "Hostelworld" },
  { value: "airbnb", label: "Airbnb" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Téléphone" },
  { value: "website", label: "Site web" },
  { value: "other", label: "Autre" },
];

const schema = z.object({
  guest_id: z.string().min(1, "Veuillez sélectionner un client"),
  room_id: z.string().min(1, "Veuillez sélectionner une chambre"),
  check_in_date: z.string().min(1, "Requis"),
  check_out_date: z.string().min(1, "Requis"),
  adults: z.coerce.number().min(1).default(1),
  children: z.coerce.number().min(0).default(0),
  source: z.string().default("direct"),
  rate_per_night: z.coerce.number().min(0, "Requis"),
  special_requests: z.string().optional(),
  internal_notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type NewReservationFormProps = {
  guests: Partial<Guest>[];
  rooms: Partial<Room>[];
};

export function NewReservationForm({ guests: initialGuests, rooms }: NewReservationFormProps) {
  const router = useRouter();
  const [showAddGuest, setShowAddGuest] = useState(false);
  const guestList = initialGuests;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      adults: 1,
      children: 0,
      source: "direct",
    },
  });

  const checkIn = watch("check_in_date");
  const checkOut = watch("check_out_date");
  const roomId = watch("room_id");
  const ratePerNight = watch("rate_per_night");

  // Auto-fill rate when room is selected
  function handleRoomChange(id: string) {
    setValue("room_id", id);
    const room = rooms.find((r) => r.id === id);
    if (room?.base_price) {
      setValue("rate_per_night", room.base_price);
    }
  }

  const nights =
    checkIn && checkOut
      ? Math.max(0, differenceInDays(parseISO(checkOut), parseISO(checkIn)))
      : 0;
  const total = nights * (ratePerNight || 0);

  async function onSubmit(values: FormValues) {
    try {
      const reservation = await createReservation({
        ...values,
        source: values.source as Parameters<typeof createReservation>[0]["source"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as unknown as Record<string, unknown>;
      toast.success(`Réservation ${reservation.confirmation_code} créée`);
      router.push(`/reservations/${reservation.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="text-stone-500 -ml-2">
        <ArrowLeft size={16} className="mr-2" /> Retour
      </Button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Guest */}
        <div className="hp-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User size={18} className="text-teal-600" />
            <h2 className="font-heading font-semibold text-stone-900">Client</h2>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label>Client *</Label>
              <select
                {...register("guest_id")}
                className={`flex h-10 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600
                  ${errors.guest_id ? "border-red-500" : "border-stone-200"}`}
              >
                <option value="">Sélectionner un client</option>
                {guestList.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.last_name} {g.first_name}
                    {g.phone ? ` · ${g.phone}` : ""}
                  </option>
                ))}
              </select>
              {errors.guest_id && (
                <p className="text-xs text-red-500">{errors.guest_id.message}</p>
              )}
            </div>
            <div className="pt-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddGuest(true)}
                className="h-10"
              >
                <Plus size={14} className="mr-1" /> Nouveau
              </Button>
            </div>
          </div>
        </div>

        {/* Dates & Room */}
        <div className="hp-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={18} className="text-teal-600" />
            <h2 className="font-heading font-semibold text-stone-900">
              Séjour
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Arrivée *</Label>
              <Input
                type="date"
                {...register("check_in_date")}
                className={errors.check_in_date ? "border-red-500" : ""}
              />
              {errors.check_in_date && (
                <p className="text-xs text-red-500">{errors.check_in_date.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Départ *</Label>
              <Input
                type="date"
                min={checkIn}
                {...register("check_out_date")}
                className={errors.check_out_date ? "border-red-500" : ""}
              />
              {errors.check_out_date && (
                <p className="text-xs text-red-500">{errors.check_out_date.message}</p>
              )}
            </div>
          </div>

          {nights > 0 && (
            <p className="text-sm text-teal-700 font-medium bg-teal-50 px-3 py-2 rounded-lg">
              {nights} nuit{nights !== 1 ? "s" : ""}
            </p>
          )}

          <div className="space-y-1.5">
            <Label>Chambre *</Label>
            <select
              value={roomId || ""}
              onChange={(e) => handleRoomChange(e.target.value)}
              className={`flex h-10 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600
                ${errors.room_id ? "border-red-500" : "border-stone-200"}`}
            >
              <option value="">Sélectionner une chambre</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (#{r.room_number}) — {ROOM_TYPE_LABELS[r.type || "private_double"]} — {formatMAD(r.base_price || 0)}/nuit
                </option>
              ))}
            </select>
            {errors.room_id && (
              <p className="text-xs text-red-500">{errors.room_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Adultes</Label>
              <Input type="number" min={1} {...register("adults")} />
            </div>
            <div className="space-y-1.5">
              <Label>Enfants</Label>
              <Input type="number" min={0} {...register("children")} />
            </div>
            <div className="space-y-1.5">
              <Label>Provenance</Label>
              <select
                {...register("source")}
                className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="hp-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-teal-600" />
            <h2 className="font-heading font-semibold text-stone-900">Tarif</h2>
          </div>

          <div className="space-y-1.5">
            <Label>Prix par nuit (MAD) *</Label>
            <Input
              type="number"
              min={0}
              step={1}
              placeholder="250"
              {...register("rate_per_night")}
              className={errors.rate_per_night ? "border-red-500" : ""}
            />
            {errors.rate_per_night && (
              <p className="text-xs text-red-500">{errors.rate_per_night.message}</p>
            )}
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between bg-teal-50 rounded-xl p-4">
              <div>
                <p className="text-xs text-stone-500">Total du séjour</p>
                <p className="text-2xl font-heading font-bold text-teal-700">
                  {formatMAD(total)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-500">{nights} nuits × {formatMAD(ratePerNight || 0)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="hp-card p-6 space-y-4">
          <h2 className="font-heading font-semibold text-stone-900">Notes</h2>
          <div className="space-y-1.5">
            <Label>Demandes spéciales <span className="text-stone-400 text-xs">(visible par le client)</span></Label>
            <Textarea
              placeholder="Chambre calme, étage élevé..."
              rows={2}
              {...register("special_requests")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes internes <span className="text-stone-400 text-xs">(privé)</span></Label>
            <Textarea
              placeholder="Paiement en espèces attendu..."
              rows={2}
              {...register("internal_notes")}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Créer la réservation
          </Button>
        </div>
      </form>

      <GuestFormDialog
        open={showAddGuest}
        onClose={() => {
          setShowAddGuest(false);
          router.refresh(); // Reload page so the new guest appears in the dropdown
        }}
      />
    </div>
  );
}
