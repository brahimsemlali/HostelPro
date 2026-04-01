"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createExpense } from "@/lib/actions/finances";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

const schema = z.object({
  category: z.enum([
    "supplies", "utilities", "maintenance", "food_beverage", "wages",
    "marketing", "commission", "tax", "insurance", "rent", "equipment", "other",
  ]),
  description: z.string().min(1, "Requis"),
  amount: z.coerce.number().min(0.01, "Montant requis"),
  vendor: z.string().optional(),
  expense_date: z.string().min(1, "Requis"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function AddExpenseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      category: "supplies",
      expense_date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await createExpense(values);
      toast.success("Dépense ajoutée");
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Nouvelle dépense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Catégorie *</Label>
            <select {...register("category")}
              className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600">
              <option value="supplies">Fournitures</option>
              <option value="utilities">Charges (eau, élec, gaz)</option>
              <option value="maintenance">Maintenance</option>
              <option value="food_beverage">Alimentation & Boissons</option>
              <option value="wages">Salaires</option>
              <option value="marketing">Marketing</option>
              <option value="commission">Commissions OTA</option>
              <option value="tax">Taxes & Impôts</option>
              <option value="insurance">Assurance</option>
              <option value="rent">Loyer</option>
              <option value="equipment">Équipement</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Input placeholder="Papier toilette, ampoules LED..." {...register("description")}
              className={errors.description ? "border-red-500" : ""} />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Montant (MAD) *</Label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" {...register("amount")}
                className={errors.amount ? "border-red-500" : ""} />
              {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" {...register("expense_date")} className={errors.expense_date ? "border-red-500" : ""} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Fournisseur <span className="text-stone-400 text-xs">(optionnel)</span></Label>
            <Input placeholder="Marjane, Aswak Assalam..." {...register("vendor")} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes <span className="text-stone-400 text-xs">(optionnel)</span></Label>
            <Textarea rows={2} placeholder="Informations supplémentaires..." {...register("notes")} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
              {isSubmitting ? <Loader2 size={15} className="animate-spin mr-2" /> : null}
              Ajouter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
