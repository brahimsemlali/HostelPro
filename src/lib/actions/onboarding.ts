"use server";

import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const onboardingSchema = z.object({
  name: z.string().min(2),
  city: z.string().min(1),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  check_in_time: z.string().default("14:00"),
  check_out_time: z.string().default("11:00"),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createOrganizationAndProfile(
  data: z.infer<typeof onboardingSchema>
) {
  const supabase = await createServerClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Non autorisé");

  const validated = onboardingSchema.parse(data);

  const baseSlug = slugify(validated.name);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  // Use admin client to bypass RLS — user has no org yet so RLS would block INSERT
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: validated.name,
      slug,
      city: validated.city,
      address: validated.address || null,
      phone: validated.phone || null,
      email: validated.email || null,
      currency: "MAD",
      timezone: "Africa/Casablanca",
      tax_sejour_rate: 0,
      subscription_tier: "free",
      settings: {
        check_in_time: validated.check_in_time,
        check_out_time: validated.check_out_time,
      },
    })
    .select()
    .single();

  if (orgError || !org) {
    throw new Error(orgError?.message || "Impossible de créer l'organisation");
  }

  // Upsert profile with the new org
  const { error: profileError } = await admin.from("profiles").upsert({
    id: user.id,
    full_name:
      user.user_metadata?.full_name || user.email || "Propriétaire",
    organization_id: org.id,
    role: "owner",
    is_active: true,
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  return { organization: org };
}
