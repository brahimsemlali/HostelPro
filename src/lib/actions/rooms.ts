"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const roomSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  room_number: z.string().min(1, "Le numéro est requis"),
  type: z.enum([
    "private_single",
    "private_double",
    "private_twin",
    "suite",
    "dorm",
    "camping",
  ]),
  base_price: z.coerce.number().min(0, "Le prix doit être positif"),
  max_occupancy: z.coerce.number().min(1),
  bed_count: z.coerce.number().min(1),
  description: z.string().optional(),
  floor_id: z.string().uuid().optional().nullable(),
  amenities: z.array(z.string()).default([]),
});

export async function createRoom(data: z.infer<typeof roomSchema>) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) throw new Error("Organisation introuvable");

  const validated = roomSchema.parse(data);

  // Get current max sort_order
  const { data: lastRoom } = await supabase
    .from("rooms")
    .select("sort_order")
    .eq("organization_id", profile.organization_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: room, error } = await supabase
    .from("rooms")
    .insert({
      ...validated,
      organization_id: profile.organization_id,
      status: "active",
      is_active: true,
      sort_order: (lastRoom?.sort_order ?? 0) + 1,
      photos: [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/rooms");
  return room;
}

export async function updateRoom(
  id: string,
  data: Partial<z.infer<typeof roomSchema>>
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const { error } = await supabase
    .from("rooms")
    .update(data)
    .eq("id", id)
    .eq("organization_id", profile?.organization_id ?? "");

  if (error) throw new Error(error.message);

  revalidatePath("/rooms");
  revalidatePath(`/rooms/${id}`);
}

export async function updateRoomStatus(
  id: string,
  status: "active" | "maintenance" | "blocked" | "retired"
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const { error } = await supabase
    .from("rooms")
    .update({ status })
    .eq("id", id)
    .eq("organization_id", profile?.organization_id ?? "");

  if (error) throw new Error(error.message);

  revalidatePath("/rooms");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

export async function deleteRoom(id: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  // Soft delete — mark as retired
  const { error } = await supabase
    .from("rooms")
    .update({ is_active: false, status: "retired" })
    .eq("id", id)
    .eq("organization_id", profile?.organization_id ?? "");

  if (error) throw new Error(error.message);

  revalidatePath("/rooms");
}

export async function createFloor(name: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const { data: lastFloor } = await supabase
    .from("floors")
    .select("sort_order")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("floors")
    .insert({
      name,
      organization_id: profile?.organization_id ?? "",
      sort_order: (lastFloor?.sort_order ?? 0) + 1,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/rooms");
  return data;
}
