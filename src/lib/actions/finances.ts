"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const paymentSchema = z.object({
  reservation_id: z.string().uuid("Réservation invalide"),
  amount: z.coerce.number().min(0.01, "Montant invalide"),
  method: z.enum(["cash", "card", "bank_transfer", "mobile_money", "online", "other"]),
  type: z.enum(["booking_payment", "deposit", "extra_charge", "refund"]).default("booking_payment"),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  payment_date: z.string().min(1, "Date requise"),
});

const expenseSchema = z.object({
  category: z.enum([
    "supplies", "utilities", "maintenance", "food_beverage", "wages",
    "marketing", "commission", "tax", "insurance", "rent", "equipment", "other",
  ]),
  description: z.string().min(1, "Description requise"),
  amount: z.coerce.number().min(0.01, "Montant invalide"),
  vendor: z.string().optional().nullable(),
  expense_date: z.string().min(1, "Date requise"),
  notes: z.string().optional().nullable(),
});

async function getOrgId(supabase: Awaited<ReturnType<typeof createServerClient>>, userId: string) {
  const { data } = await supabase.from("profiles").select("organization_id").eq("id", userId).single();
  return data?.organization_id ?? null;
}

export async function createPayment(data: z.infer<typeof paymentSchema>) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");
  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) throw new Error("Organisation introuvable");

  const validated = paymentSchema.parse(data);

  // Fetch the reservation to verify org ownership + current balance
  const { data: reservation, error: resErr } = await supabase
    .from("reservations")
    .select("id, total_amount, amount_paid, balance_due, guest_id")
    .eq("id", validated.reservation_id)
    .eq("organization_id", orgId)
    .single();

  if (resErr || !reservation) throw new Error("Réservation introuvable");

  const { error: payErr } = await supabase.from("payments").insert({
    organization_id: orgId,
    reservation_id: validated.reservation_id,
    guest_id: reservation.guest_id,
    amount: validated.amount,
    currency: "MAD",
    method: validated.method,
    type: validated.type,
    reference: validated.reference || null,
    notes: validated.notes || null,
    received_by: user.id,
    payment_date: validated.payment_date,
  });

  if (payErr) throw new Error(payErr.message);

  // Update reservation balance
  const newAmountPaid = (reservation.amount_paid || 0) + validated.amount;
  const newBalanceDue = Math.max(0, (reservation.total_amount || 0) - newAmountPaid);

  await supabase
    .from("reservations")
    .update({ amount_paid: newAmountPaid, balance_due: newBalanceDue })
    .eq("id", validated.reservation_id)
    .eq("organization_id", orgId);

  revalidatePath("/finances");
  revalidatePath(`/reservations/${validated.reservation_id}`);
  revalidatePath("/dashboard");
}

export async function createExpense(data: z.infer<typeof expenseSchema>) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");
  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) throw new Error("Organisation introuvable");

  const validated = expenseSchema.parse(data);

  const { error } = await supabase.from("expenses").insert({
    organization_id: orgId,
    category: validated.category,
    description: validated.description,
    amount: validated.amount,
    vendor: validated.vendor || null,
    expense_date: validated.expense_date,
    notes: validated.notes || null,
    is_recurring: false,
    recorded_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/finances");
}

export async function deleteExpense(id: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");
  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) throw new Error("Organisation introuvable");

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);
  revalidatePath("/finances");
}

export async function deletePayment(id: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");
  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) throw new Error("Organisation introuvable");

  // Fetch the payment first to reverse the reservation balance
  const { data: payment } = await supabase
    .from("payments")
    .select("amount, reservation_id")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (!payment) throw new Error("Paiement introuvable");

  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);

  // Reverse the reservation balance if linked
  if (payment.reservation_id) {
    const { data: res } = await supabase
      .from("reservations")
      .select("total_amount, amount_paid")
      .eq("id", payment.reservation_id)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (res) {
      const newAmountPaid = Math.max(0, (res.amount_paid || 0) - payment.amount);
      const newBalanceDue = Math.max(0, (res.total_amount || 0) - newAmountPaid);
      await supabase
        .from("reservations")
        .update({ amount_paid: newAmountPaid, balance_due: newBalanceDue })
        .eq("id", payment.reservation_id)
        .eq("organization_id", orgId);
    }
  }

  revalidatePath("/finances");
  if (payment.reservation_id) revalidatePath(`/reservations/${payment.reservation_id}`);
}
