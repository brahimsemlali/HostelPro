"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateConfirmationCode } from "@/lib/utils/confirmation-code";
import { differenceInDays, parseISO } from "date-fns";

const reservationSchema = z.object({
  guest_id: z.string().uuid("Client invalide"),
  room_id: z.string().uuid("Chambre invalide"),
  bed_id: z.string().uuid().optional().nullable(),
  check_in_date: z.string().min(1, "Date d'arrivée requise"),
  check_out_date: z.string().min(1, "Date de départ requise"),
  adults: z.coerce.number().min(1).default(1),
  children: z.coerce.number().min(0).default(0),
  source: z
    .enum([
      "direct",
      "walk_in",
      "booking_com",
      "hostelworld",
      "airbnb",
      "whatsapp",
      "phone",
      "website",
      "other",
    ])
    .default("direct"),
  special_requests: z.string().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
  rate_per_night: z.coerce.number().min(0),
});

export async function createReservation(
  data: z.infer<typeof reservationSchema>
) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) throw new Error("Organisation introuvable");

  const validated = reservationSchema.parse(data);

  const nights = differenceInDays(
    parseISO(validated.check_out_date),
    parseISO(validated.check_in_date)
  );

  if (nights <= 0) throw new Error("La date de départ doit être après l'arrivée");

  // Check availability
  const { data: conflicts } = await supabase
    .from("reservation_rooms")
    .select("id, reservation:reservations!inner(status, check_in_date, check_out_date)")
    .eq("room_id", validated.room_id);

  const hasConflict = (conflicts || []).some((c) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = (c as any).reservation as {
      status: string;
      check_in_date: string;
      check_out_date: string;
    };
    if (!["confirmed", "checked_in"].includes(res.status)) return false;
    return (
      res.check_in_date < validated.check_out_date &&
      res.check_out_date > validated.check_in_date
    );
  });

  if (hasConflict) {
    throw new Error(
      "Cette chambre n'est pas disponible pour les dates sélectionnées"
    );
  }

  const totalAmount = validated.rate_per_night * nights;

  // Generate unique confirmation code
  let confirmationCode = generateConfirmationCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from("reservations")
      .select("id")
      .eq("confirmation_code", confirmationCode)
      .maybeSingle();
    if (!existing) break;
    confirmationCode = generateConfirmationCode();
    attempts++;
  }

  const { data: reservation, error: resError } = await supabase
    .from("reservations")
    .insert({
      organization_id: profile.organization_id,
      confirmation_code: confirmationCode,
      guest_id: validated.guest_id,
      status: "confirmed",
      source: validated.source,
      check_in_date: validated.check_in_date,
      check_out_date: validated.check_out_date,
      nights,
      adults: validated.adults,
      children: validated.children,
      total_amount: totalAmount,
      amount_paid: 0,
      balance_due: totalAmount,
      special_requests: validated.special_requests || null,
      internal_notes: validated.internal_notes || null,
    })
    .select()
    .single();

  if (resError || !reservation) throw new Error(resError?.message || "Erreur");

  // Create reservation_room link
  const { error: rrError } = await supabase.from("reservation_rooms").insert({
    reservation_id: reservation.id,
    room_id: validated.room_id,
    bed_id: validated.bed_id || null,
    rate_per_night: validated.rate_per_night,
  });

  if (rrError) {
    // Rollback reservation
    await supabase.from("reservations").delete().eq("id", reservation.id);
    throw new Error(rrError.message);
  }

  revalidatePath("/reservations");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  return reservation;
}

export async function updateReservationStatus(
  id: string,
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show",
  extra?: { cancellation_reason?: string; actual_check_in?: string; actual_check_out?: string }
) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const updateData: Record<string, unknown> = { status };
  if (extra?.cancellation_reason)
    updateData.cancellation_reason = extra.cancellation_reason;
  if (status === "checked_in")
    updateData.actual_check_in = extra?.actual_check_in || new Date().toISOString();
  if (status === "checked_out")
    updateData.actual_check_out =
      extra?.actual_check_out || new Date().toISOString();

  const { error } = await supabase
    .from("reservations")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", profile?.organization_id ?? "");

  if (error) throw new Error(error.message);

  // On checkout, create housekeeping task
  if (status === "checked_out") {
    const { data: resRooms } = await supabase
      .from("reservation_rooms")
      .select("room_id")
      .eq("reservation_id", id);

    for (const rr of resRooms || []) {
      await supabase.from("housekeeping_tasks").insert({
        organization_id: profile?.organization_id ?? "",
        room_id: rr.room_id,
        type: "checkout_clean",
        status: "pending",
        priority: "urgent",
      });
    }
  }

  revalidatePath("/reservations");
  revalidatePath(`/reservations/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

export async function cancelReservation(id: string, reason: string) {
  return updateReservationStatus(id, "cancelled", {
    cancellation_reason: reason,
  });
}
