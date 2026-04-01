"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { createPayment } from "@/lib/actions/finances";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMAD } from "@/lib/utils/currency";
import { format } from "date-fns";

const schema = z.object({
  reservation_id: z.string().uuid("Sélectionner une réservation"),
  amount: z.coerce.number().min(0.01, "Montant requis"),
  method: z.enum(["cash", "card", "bank_transfer", "mobile_money", "online", "other"]),
  type: z.enum(["booking_payment", "deposit", "extra_charge", "refund"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
  payment_date: z.string().min(1, "Date requise"),
});

type FormValues = z.infer<typeof schema>;

type SearchResult = {
  id: string;
  confirmation_code: string;
  balance_due: number;
  total_amount: number;
  guest: { first_name: string; last_name: string } | null;
};

type AddPaymentDialogProps = {
  open: boolean;
  onClose: () => void;
  prefilledReservationId?: string;
};

export function AddPaymentDialog({ open, onClose, prefilledReservationId }: AddPaymentDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingPrefill, setLoadingPrefill] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      method: "cash",
      type: "booking_payment",
      payment_date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  // Auto-load prefilled reservation when dialog opens
  useEffect(() => {
    if (open && prefilledReservationId && !selectedReservation) {
      setLoadingPrefill(true);
      const supabase = createClient();
      supabase
        .from("reservations")
        .select("id, confirmation_code, balance_due, total_amount, guest:guests(first_name, last_name)")
        .eq("id", prefilledReservationId)
        .single()
        .then(({ data }) => {
          if (data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            selectReservation(data as any);
          }
          setLoadingPrefill(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefilledReservationId]);

  async function searchReservations(query: string) {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("reservations")
      .select("id, confirmation_code, balance_due, total_amount, guest:guests(first_name, last_name)")
      .in("status", ["confirmed", "checked_in", "checked_out"])
      .or(`confirmation_code.ilike.%${query}%`)
      .limit(5);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSearchResults((data || []) as any[]);
    setSearching(false);
  }

  function selectReservation(res: SearchResult) {
    setSelectedReservation(res);
    setValue("reservation_id", res.id);
    if (res.balance_due > 0) setValue("amount", res.balance_due);
    setSearchQuery("");
    setSearchResults([]);
  }

  async function onSubmit(values: FormValues) {
    try {
      await createPayment(values);
      toast.success("Paiement enregistré");
      reset();
      setSelectedReservation(null);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  }

  function handleClose() {
    reset();
    setSelectedReservation(null);
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Enregistrer un paiement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Reservation search */}
          <div className="space-y-2">
            <Label>Réservation *</Label>
            {loadingPrefill ? (
              <div className="flex items-center gap-2 h-10 px-3 bg-stone-50 border border-stone-200 rounded-lg">
                <Loader2 size={14} className="animate-spin text-stone-400" />
                <span className="text-sm text-stone-400">Chargement...</span>
              </div>
            ) : selectedReservation ? (
              <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-teal-800 font-mono">{selectedReservation.confirmation_code}</p>
                  <p className="text-xs text-teal-600">
                    {selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name}
                    {" · "}Reste: {formatMAD(selectedReservation.balance_due)}
                  </p>
                </div>
                {!prefilledReservationId && (
                  <button type="button" onClick={() => { setSelectedReservation(null); setValue("reservation_id", ""); }}
                    className="text-teal-400 hover:text-teal-600 text-xs ml-2">Changer</button>
                )}
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <Input
                  placeholder="Code de réservation..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); searchReservations(e.target.value); }}
                />
                {(searchResults.length > 0 || searching) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-50 overflow-hidden">
                    {searching && <div className="px-3 py-2 text-xs text-stone-400">Recherche...</div>}
                    {searchResults.map((r) => (
                      <button type="button" key={r.id} onClick={() => selectReservation(r)}
                        className="w-full text-left px-3 py-2 hover:bg-stone-50 text-sm border-b border-stone-50 last:border-0">
                        <span className="font-mono text-teal-700 font-medium">{r.confirmation_code}</span>
                        <span className="text-stone-500 ml-2 text-xs">
                          {r.guest?.first_name} {r.guest?.last_name} · {formatMAD(r.balance_due)} restant
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {errors.reservation_id && <p className="text-xs text-red-500">{errors.reservation_id.message}</p>}
            <input type="hidden" {...register("reservation_id")} />
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
              <Input type="date" {...register("payment_date")} className={errors.payment_date ? "border-red-500" : ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Méthode</Label>
              <select {...register("method")}
                className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600">
                <option value="cash">Espèces</option>
                <option value="card">Carte bancaire</option>
                <option value="bank_transfer">Virement</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="online">En ligne</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select {...register("type")}
                className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600">
                <option value="booking_payment">Paiement</option>
                <option value="deposit">Acompte</option>
                <option value="extra_charge">Supplément</option>
                <option value="refund">Remboursement</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Référence <span className="text-stone-400 text-xs">(optionnel)</span></Label>
            <Input placeholder="N° de reçu, transaction..." {...register("reference")} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes <span className="text-stone-400 text-xs">(optionnel)</span></Label>
            <Textarea rows={2} placeholder="Informations supplémentaires..." {...register("notes")} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">Annuler</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
              {isSubmitting ? <Loader2 size={15} className="animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
