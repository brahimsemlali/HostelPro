"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const taskSchema = z.object({
  room_id: z.string().uuid("Chambre invalide"),
  type: z.enum(["checkout_clean", "daily_clean", "deep_clean", "turndown"]),
  priority: z.enum(["low", "normal", "high", "urgent", "critical"]).default("normal"),
  notes: z.string().optional().nullable(),
});

async function getOrgAndUser(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
  if (!profile?.organization_id) throw new Error("Organisation introuvable");
  return { user, orgId: profile.organization_id };
}

export async function createHousekeepingTask(data: z.infer<typeof taskSchema>) {
  const supabase = await createServerClient();
  const { orgId } = await getOrgAndUser(supabase);
  const validated = taskSchema.parse(data);

  const { error } = await supabase.from("housekeeping_tasks").insert({
    organization_id: orgId,
    room_id: validated.room_id,
    type: validated.type,
    priority: validated.priority,
    status: "pending",
    notes: validated.notes || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/operations/housekeeping");
}

export async function updateTaskStatus(
  id: string,
  status: "pending" | "in_progress" | "completed" | "inspected"
) {
  const supabase = await createServerClient();
  const { orgId } = await getOrgAndUser(supabase);

  const updateData: Record<string, unknown> = { status };
  if (status === "in_progress") updateData.started_at = new Date().toISOString();
  if (status === "completed" || status === "inspected") updateData.completed_at = new Date().toISOString();

  const { error } = await supabase
    .from("housekeeping_tasks")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);
  revalidatePath("/operations/housekeeping");
}

export async function deleteTask(id: string) {
  const supabase = await createServerClient();
  const { orgId } = await getOrgAndUser(supabase);

  const { error } = await supabase
    .from("housekeeping_tasks")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);
  revalidatePath("/operations/housekeeping");
}
