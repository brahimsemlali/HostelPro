"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const guestSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  id_type: z.enum(["passport", "cin", "carte_sejour", "driving_license"]).optional().nullable(),
  id_number: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  marketing_consent: z.boolean().default(false),
});

export async function createGuest(data: z.infer<typeof guestSchema>) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) throw new Error("Organisation introuvable");

  const validated = guestSchema.parse(data);

  // Clean empty strings to null
  const clean = Object.fromEntries(
    Object.entries(validated).map(([k, v]) => [k, v === "" ? null : v])
  );

  const { data: guest, error } = await supabase
    .from("guests")
    .insert({ ...clean, organization_id: profile.organization_id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/guests");
  return guest;
}

export async function updateGuest(id: string, data: Partial<z.infer<typeof guestSchema>>) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const { error } = await supabase
    .from("guests")
    .update(data)
    .eq("id", id)
    .eq("organization_id", profile?.organization_id ?? "");

  if (error) throw new Error(error.message);

  revalidatePath("/guests");
  revalidatePath(`/guests/${id}`);
}

export async function deleteGuest(id: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const { error } = await supabase
    .from("guests")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile?.organization_id ?? "");

  if (error) throw new Error(error.message);

  revalidatePath("/guests");
}
