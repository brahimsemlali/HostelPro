"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createRoom } from "@/lib/actions/rooms";
import { ROOM_AMENITIES } from "@/lib/constants/room-types";
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
import type { Floor } from "@/types";

const ROOM_TYPES = [
  { value: "private_single", label: "Chambre Simple" },
  { value: "private_double", label: "Chambre Double" },
  { value: "private_twin", label: "Chambre Twin" },
  { value: "suite", label: "Suite" },
  { value: "dorm", label: "Dortoir" },
  { value: "camping", label: "Camping" },
];

const schema = z.object({
  name: z.string().min(1, "Requis"),
  room_number: z.string().min(1, "Requis"),
  type: z.enum(["private_single", "private_double", "private_twin", "suite", "dorm", "camping"]),
  base_price: z.coerce.number().min(0, "Prix invalide"),
  max_occupancy: z.coerce.number().min(1),
  bed_count: z.coerce.number().min(1),
  description: z.string().optional(),
  floor_id: z.string().optional().nullable(),
  amenities: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

type RoomFormDialogProps = {
  open: boolean;
  onClose: () => void;
  floors: Partial<Floor>[];
};

export function RoomFormDialog({ open, onClose, floors }: RoomFormDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      type: "private_double",
      max_occupancy: 2,
      bed_count: 1,
      amenities: [],
    },
  });

  const amenities = watch("amenities");

  function toggleAmenity(value: string) {
    const current = amenities || [];
    setValue(
      "amenities",
      current.includes(value)
        ? current.filter((a) => a !== value)
        : [...current, value]
    );
  }

  async function onSubmit(values: FormValues) {
    try {
      await createRoom(values);
      toast.success("Chambre créée avec succès");
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Nouvelle chambre</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input placeholder="Chambre Atlas" {...register("name")} className={errors.name ? "border-red-500" : ""} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Numéro *</Label>
              <Input placeholder="101" {...register("room_number")} className={errors.room_number ? "border-red-500" : ""} />
              {errors.room_number && <p className="text-xs text-red-500">{errors.room_number.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <select
                {...register("type")}
                className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {floors.length > 0 && (
              <div className="space-y-1.5">
                <Label>Étage</Label>
                <select
                  {...register("floor_id")}
                  className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="">Sans étage</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Prix / nuit (MAD) *</Label>
              <Input type="number" min="0" step="1" placeholder="250" {...register("base_price")} className={errors.base_price ? "border-red-500" : ""} />
              {errors.base_price && <p className="text-xs text-red-500">{errors.base_price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Capacité max</Label>
              <Input type="number" min="1" {...register("max_occupancy")} />
            </div>
            <div className="space-y-1.5">
              <Label>Nb de lits</Label>
              <Input type="number" min="1" {...register("bed_count")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Équipements</Label>
            <div className="flex flex-wrap gap-2">
              {ROOM_AMENITIES.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => toggleAmenity(a.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border
                    ${amenities?.includes(a.value)
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-stone-600 border-stone-200 hover:border-teal-400"
                    }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description <span className="text-stone-400 text-xs">(optionnel)</span></Label>
            <Textarea
              placeholder="Vue sur la montagne, décoration typique..."
              rows={2}
              {...register("description")}
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
              Créer la chambre
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
