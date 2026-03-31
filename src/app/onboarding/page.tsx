"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Phone,
  Mail,
  CheckCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MOROCCAN_CITIES = [
  "Marrakech", "Fès", "Casablanca", "Rabat", "Agadir",
  "Tanger", "Chefchaouen", "Essaouira", "Ouarzazate",
  "Merzouga", "Dakhla", "Ifrane", "Autre",
];

const onboardingSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  city: z.string().min(1, "Veuillez sélectionner une ville"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  check_in_time: z.string().default("14:00"),
  check_out_time: z.string().default("11:00"),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(onboardingSchema) as any,
    defaultValues: {
      check_in_time: "14:00",
      check_out_time: "11:00",
    },
  });

  const propertyName = watch("name");

  async function onSubmit(values: OnboardingValues) {
    setServerError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Generate a unique slug
    const baseSlug = slugify(values.name);
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: values.name,
        slug,
        city: values.city,
        address: values.address || null,
        phone: values.phone || null,
        email: values.email || null,
        currency: "MAD",
        timezone: "Africa/Casablanca",
        tax_sejour_rate: 0,
        subscription_tier: "free",
        settings: {
          check_in_time: values.check_in_time,
          check_out_time: values.check_out_time,
        },
      })
      .select()
      .single();

    if (orgError || !org) {
      setServerError(`Erreur: ${orgError?.message || "Organisation non créée"}`);
      return;
    }

    // Create profile
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: user.user_metadata.full_name || user.email || "Propriétaire",
      organization_id: org.id,
      role: "owner",
      is_active: true,
    });

    if (profileError) {
      setServerError(`Erreur profil: ${profileError.message}`);
      return;
    }

    setStep(3);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle size={40} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-heading font-semibold text-stone-900 mb-2">
            Bienvenue sur HostelPro !
          </h2>
          <p className="text-stone-500">Redirection vers votre tableau de bord…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-2xl font-heading font-semibold text-stone-900">HostelPro</span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 px-4">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                ${s <= step ? "bg-teal-600 text-white" : "bg-stone-200 text-stone-400"}`}>
                {s}
              </div>
              {s < 2 && (
                <div className={`flex-1 h-1 rounded ${s < step ? "bg-teal-600" : "bg-stone-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-stone-200 p-8">
          {step === 1 && (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                  <Building2 size={24} className="text-teal-600" />
                </div>
                <h1 className="text-xl font-heading font-semibold text-stone-900">
                  Présentez votre établissement
                </h1>
                <p className="text-sm text-stone-500 mt-1">
                  Ces informations seront visibles par vos clients
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nom de l&apos;établissement *</Label>
                  <Input
                    id="name"
                    placeholder="Riad Atlas, Auberge Toubkal..."
                    {...register("name")}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="city">Ville *</Label>
                  <select
                    id="city"
                    {...register("city")}
                    className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  >
                    <option value="">Sélectionner une ville</option>
                    {MOROCCAN_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {errors.city && (
                    <p className="text-xs text-red-500">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address">
                    Adresse{" "}
                    <span className="text-stone-400 text-xs">(optionnel)</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="123 Rue principale, Médina"
                    {...register("address")}
                  />
                </div>

                <Button
                  type="button"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => setStep(2)}
                  disabled={!propertyName}
                >
                  Continuer
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-6">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                  <Phone size={24} className="text-teal-600" />
                </div>
                <h1 className="text-xl font-heading font-semibold text-stone-900">
                  Contact & Horaires
                </h1>
                <p className="text-sm text-stone-500 mt-1">
                  Informations de contact et horaires par défaut
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Téléphone</Label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <Input
                        id="phone"
                        placeholder="+212 6XX XXX XXX"
                        className="pl-9"
                        {...register("phone")}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="contact@..."
                        className="pl-9"
                        {...register("email")}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="check_in_time">Check-in</Label>
                    <Input
                      id="check_in_time"
                      type="time"
                      {...register("check_in_time")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="check_out_time">Check-out</Label>
                    <Input
                      id="check_out_time"
                      type="time"
                      {...register("check_out_time")}
                    />
                  </div>
                </div>

                {serverError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                    {serverError}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : null}
                    Créer mon espace
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
