"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createGuest, updateGuest } from "@/lib/actions/guests";
import { NATIONALITIES } from "@/lib/constants/nationalities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Guest } from "@/types";

const schema = z.object({
  first_name: z.string().min(1, "Requis"),
  last_name: z.string().min(1, "Requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  id_type: z.enum(["passport", "cin", "carte_sejour", "driving_license", ""]).optional(),
  id_number: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type GuestFormDialogProps = {
  open: boolean;
  onClose: () => void;
  guest?: Partial<Guest>;
};

export function GuestFormDialog({ open, onClose, guest }: GuestFormDialogProps) {
  const isEditing = !!guest?.id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: guest
      ? {
          first_name: guest.first_name || "",
          last_name: guest.last_name || "",
          email: guest.email || "",
          phone: guest.phone || "",
          nationality: guest.nationality || "",
          id_type: (guest.id_type as FormValues["id_type"]) || "",
          id_number: guest.id_number || "",
          date_of_birth: guest.date_of_birth || "",
          gender: guest.gender || "",
          notes: guest.notes || "",
        }
      : {},
  });

  async function onSubmit(values: FormValues) {
    try {
      // Clean empty id_type string to null
      const cleanValues = {
        ...values,
        id_type: (values.id_type === "" ? null : values.id_type) as Parameters<typeof createGuest>[0]["id_type"],
      };
      if (isEditing && guest?.id) {
        await updateGuest(guest.id, cleanValues);
        toast.success("Client mis à jour");
      } else {
        await createGuest(cleanValues as Parameters<typeof createGuest>[0]);
        toast.success("Client ajouté");
      }
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEditing ? "Modifier le client" : "Nouveau client"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Prénom *</Label>
              <Input placeholder="Ahmed" {...register("first_name")} className={errors.first_name ? "border-red-500" : ""} />
              {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input placeholder="Benali" {...register("last_name")} className={errors.last_name ? "border-red-500" : ""} />
              {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input placeholder="+212 6XX XXX XXX" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="ahmed@..." {...register("email")} className={errors.email ? "border-red-500" : ""} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nationalité</Label>
              <select
                {...register("nationality")}
                className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">Sélectionner</option>
                {NATIONALITIES.map((n) => (
                  <option key={n.code} value={n.code}>{n.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Date de naissance</Label>
              <Input type="date" {...register("date_of_birth")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type de pièce d&apos;identité</Label>
              <select
                {...register("id_type")}
                className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">Sélectionner</option>
                <option value="passport">Passeport</option>
                <option value="cin">CIN</option>
                <option value="carte_sejour">Carte de séjour</option>
                <option value="driving_license">Permis de conduire</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Numéro de pièce</Label>
              <Input placeholder="AB123456" {...register("id_number")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes <span className="text-stone-400 text-xs">(privé)</span></Label>
            <Textarea
              placeholder="Préférences, informations importantes..."
              rows={2}
              {...register("notes")}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              {isEditing ? "Mettre à jour" : "Ajouter le client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
