"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const forgotSchema = z.object({
  email: z.string().email("Adresse email invalide"),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
  });

  async function onSubmit(values: ForgotValues) {
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    // Always show success to prevent email enumeration
    setSent(true);
  }

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-stone-200 p-8 text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-heading font-semibold text-stone-900 mb-2">
          Email envoyé
        </h2>
        <p className="text-sm text-stone-500 mb-6">
          Si un compte existe pour{" "}
          <strong className="text-stone-700">{getValues("email")}</strong>, vous
          recevrez un lien de réinitialisation.
        </p>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            <ArrowLeft size={16} className="mr-2" />
            Retour à la connexion
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-stone-200 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-semibold text-stone-900">
          Mot de passe oublié
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Entrez votre email pour recevoir un lien de réinitialisation
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            autoComplete="email"
            {...register("email")}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : null}
          Envoyer le lien
        </Button>
      </form>

      <p className="text-center mt-6">
        <Link
          href="/login"
          className="text-sm text-stone-500 hover:text-stone-700 inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
