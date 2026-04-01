"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { deleteExpense, deletePayment } from "@/lib/actions/finances";
import { AddPaymentDialog } from "./AddPaymentDialog";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { Button } from "@/components/ui/button";
import { formatMAD } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import type { Payment, Expense, Reservation, Guest } from "@/types";

const RevenueChart = dynamic(() => import("./RevenueChart").then(m => ({ default: m.RevenueChart })), {
  ssr: false,
  loading: () => <div className="h-64 bg-stone-50 rounded-xl animate-pulse" />,
});

const TABS = [
  { value: "overview", label: "Vue d'ensemble" },
  { value: "payments", label: "Paiements" },
  { value: "expenses", label: "Dépenses" },
  { value: "balance", label: "Soldes dus" },
];

const METHOD_LABELS: Record<string, string> = {
  cash: "Espèces", card: "Carte", bank_transfer: "Virement",
  mobile_money: "Mobile", online: "En ligne", other: "Autre",
};
const TYPE_LABELS: Record<string, string> = {
  booking_payment: "Paiement", deposit: "Acompte",
  extra_charge: "Supplément", refund: "Remboursement",
};
const CATEGORY_LABELS: Record<string, string> = {
  supplies: "Fournitures", utilities: "Charges", maintenance: "Maintenance",
  food_beverage: "F&B", wages: "Salaires", marketing: "Marketing",
  commission: "Commission", tax: "Taxes", insurance: "Assurance",
  rent: "Loyer", equipment: "Équipement", other: "Autre",
};

type ChartDataPoint = { label: string; revenue: number; expenses: number; profit: number };

// Expense from DB may have notes field added via select("*") even if not in the base type
type ExpenseRow = Partial<Expense> & { id: string; notes?: string | null; vendor?: string | null };

type FinancesContentProps = {
  payments: (Partial<Payment> & { id: string })[];
  expenses: ExpenseRow[];
  reservationsWithBalance: Array<Partial<Reservation> & { guest?: Partial<Guest> }>;
  chartData: ChartDataPoint[];
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  currentMonth: number;
  currentYear: number;
  activeTab: string;
  reservationMap: Record<string, { confirmation_code: string; guest?: { first_name: string; last_name: string } }>;
};

export function FinancesContent({
  payments,
  expenses,
  reservationsWithBalance,
  chartData,
  totalRevenue,
  totalExpenses,
  netProfit,
  currentMonth,
  currentYear,
  activeTab: initialTab,
  reservationMap,
}: FinancesContentProps) {
  const router = useRouter();
  const [tab, setTab] = useState(initialTab);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function navigate(direction: "prev" | "next") {
    const d = new Date(currentYear, currentMonth + (direction === "next" ? 1 : -1));
    router.push(`/finances?tab=${tab}&month=${d.getMonth()}&year=${d.getFullYear()}`);
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm("Supprimer cette dépense ?")) return;
    setDeletingId(id);
    try {
      await deleteExpense(id);
      toast.success("Dépense supprimée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeletePayment(id: string) {
    if (!confirm("Supprimer ce paiement ? Le solde de la réservation sera ajusté.")) return;
    setDeletingId(id);
    try {
      await deletePayment(id);
      toast.success("Paiement supprimé");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeletingId(null);
    }
  }

  const monthName = new Date(currentYear, currentMonth).toLocaleString("fr-MA", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Tabs + Month nav */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-stone-100 rounded-xl p-1 gap-0.5 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                ${tab === t.value ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("prev")} className="h-9 w-9">
            <ChevronLeft size={15} />
          </Button>
          <span className="text-sm font-medium text-stone-700 capitalize w-40 text-center">{monthName}</span>
          <Button variant="outline" size="icon" onClick={() => navigate("next")} className="h-9 w-9">
            <ChevronRight size={15} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="hp-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-stone-500">Recettes du mois</p>
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={18} className="text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-stone-900">{formatMAD(totalRevenue)}</p>
          <p className="text-xs text-stone-400 mt-1">{payments.length} paiement{payments.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="hp-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-stone-500">Dépenses du mois</p>
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <TrendingDown size={18} className="text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-stone-900">{formatMAD(totalExpenses)}</p>
          <p className="text-xs text-stone-400 mt-1">{expenses.length} dépense{expenses.length !== 1 ? "s" : ""}</p>
        </div>
        <div className={`hp-card p-5 ${netProfit >= 0 ? "border-emerald-200" : "border-red-200"}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-stone-500">Bénéfice net</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${netProfit >= 0 ? "bg-teal-50" : "bg-red-50"}`}>
              <DollarSign size={18} className={netProfit >= 0 ? "text-teal-500" : "text-red-400"} />
            </div>
          </div>
          <p className={`text-2xl font-heading font-bold ${netProfit >= 0 ? "text-teal-700" : "text-red-600"}`}>
            {formatMAD(netProfit)}
          </p>
          <p className="text-xs text-stone-400 mt-1">
            {netProfit >= 0 ? "Excédent" : "Déficit"}
          </p>
        </div>
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="hp-card p-6">
            <h2 className="font-heading font-semibold text-stone-900 mb-4">Revenus & Dépenses — 12 mois</h2>
            <RevenueChart data={chartData} />
          </div>

          {/* Top expense categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="hp-card p-6">
              <h3 className="font-heading font-semibold text-stone-900 mb-4">Derniers paiements</h3>
              {payments.slice(0, 5).length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-4">Aucun paiement ce mois</p>
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 5).map((p) => {
                    const res = p.reservation_id ? reservationMap[p.reservation_id] : null;
                    return (
                      <div key={p.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-stone-900">
                            {res?.guest ? `${res.guest.first_name} ${res.guest.last_name}` : "Paiement"}
                          </p>
                          <p className="text-xs text-stone-400">
                            {METHOD_LABELS[p.method || "cash"]} · {p.payment_date && formatDate(p.payment_date)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-emerald-700">{formatMAD(p.amount || 0)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="hp-card p-6">
              <h3 className="font-heading font-semibold text-stone-900 mb-4">Dernières dépenses</h3>
              {expenses.slice(0, 5).length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-4">Aucune dépense ce mois</p>
              ) : (
                <div className="space-y-3">
                  {expenses.slice(0, 5).map((e) => (
                    <div key={e.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-stone-900">{e.description}</p>
                        <p className="text-xs text-stone-400">
                          {CATEGORY_LABELS[e.category || "other"]} · {e.expense_date && formatDate(e.expense_date)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-red-600">{formatMAD(e.amount || 0)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddPayment(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus size={15} className="mr-2" /> Enregistrer un paiement
            </Button>
          </div>
          {payments.length === 0 ? (
            <EmptyState icon={<CreditCard size={40} className="text-stone-200" />} title="Aucun paiement" desc="Aucun paiement enregistré pour le moment." />
          ) : (
            <div className="hp-card overflow-hidden">
              <table className="w-full hidden md:table">
                <thead className="border-b border-stone-100">
                  <tr>
                    <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Client / Réservation</th>
                    <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Méthode</th>
                    <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Type</th>
                    <th className="text-right text-xs font-medium text-stone-400 px-6 py-3">Montant</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {payments.map((p) => {
                    const res = p.reservation_id ? reservationMap[p.reservation_id] : null;
                    return (
                      <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-stone-600">
                          {p.payment_date && formatDate(p.payment_date)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-stone-900">
                            {res?.guest ? `${res.guest.first_name} ${res.guest.last_name}` : "—"}
                          </p>
                          {res && (
                            <p className="text-xs text-teal-600 font-mono">{res.confirmation_code}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
                            {METHOD_LABELS[p.method || "cash"]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-stone-500">{TYPE_LABELS[p.type || "booking_payment"]}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className={`text-sm font-semibold ${p.type === "refund" ? "text-red-600" : "text-emerald-700"}`}>
                            {p.type === "refund" ? "-" : "+"}{formatMAD(p.amount || 0)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            disabled={deletingId === p.id}
                            className="text-stone-300 hover:text-red-400 transition-colors"
                          >
                            {deletingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Mobile */}
              <div className="md:hidden divide-y divide-stone-50">
                {payments.map((p) => {
                  const res = p.reservation_id ? reservationMap[p.reservation_id] : null;
                  return (
                    <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-stone-900">
                          {res?.guest ? `${res.guest.first_name} ${res.guest.last_name}` : METHOD_LABELS[p.method || "cash"]}
                        </p>
                        <p className="text-xs text-stone-400">{p.payment_date && formatDate(p.payment_date)} · {METHOD_LABELS[p.method || "cash"]}</p>
                      </div>
                      <p className={`text-sm font-bold ${p.type === "refund" ? "text-red-600" : "text-emerald-700"}`}>
                        {formatMAD(p.amount || 0)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "expenses" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddExpense(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus size={15} className="mr-2" /> Ajouter une dépense
            </Button>
          </div>
          {expenses.length === 0 ? (
            <EmptyState icon={<Receipt size={40} className="text-stone-200" />} title="Aucune dépense" desc="Ajoutez vos dépenses pour suivre la rentabilité." />
          ) : (
            <div className="hp-card overflow-hidden">
              <table className="w-full hidden md:table">
                <thead className="border-b border-stone-100">
                  <tr>
                    <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Description</th>
                    <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Catégorie</th>
                    <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Fournisseur</th>
                    <th className="text-right text-xs font-medium text-stone-400 px-6 py-3">Montant</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-stone-600">
                        {e.expense_date && formatDate(e.expense_date)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-stone-900">{e.description}</p>
                        {e.notes && <p className="text-xs text-stone-400 truncate max-w-xs">{e.notes}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
                          {CATEGORY_LABELS[e.category || "other"]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-500">{e.vendor || "—"}</td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-semibold text-red-600">{formatMAD(e.amount || 0)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteExpense(e.id)}
                          disabled={deletingId === e.id}
                          className="text-stone-300 hover:text-red-400 transition-colors"
                        >
                          {deletingId === e.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Mobile */}
              <div className="md:hidden divide-y divide-stone-50">
                {expenses.map((e) => (
                  <div key={e.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-stone-900">{e.description}</p>
                      <p className="text-xs text-stone-400">{e.expense_date && formatDate(e.expense_date)} · {CATEGORY_LABELS[e.category || "other"]}</p>
                    </div>
                    <p className="text-sm font-bold text-red-600">{formatMAD(e.amount || 0)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "balance" && (
        <div className="space-y-4">
          <p className="text-sm text-stone-500">Réservations avec un solde impayé</p>
          {reservationsWithBalance.length === 0 ? (
            <EmptyState icon={<DollarSign size={40} className="text-stone-200" />} title="Aucun solde impayé" desc="Toutes les réservations sont entièrement réglées." />
          ) : (
            <div className="hp-card overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-stone-100">
                  <tr>
                    <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Réservation</th>
                    <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Client</th>
                    <th className="text-left text-xs font-medium text-stone-400 px-6 py-3">Séjour</th>
                    <th className="text-right text-xs font-medium text-stone-400 px-6 py-3">Total</th>
                    <th className="text-right text-xs font-medium text-stone-400 px-6 py-3">Payé</th>
                    <th className="text-right text-xs font-medium text-stone-400 px-6 py-3">Reste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {reservationsWithBalance.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded">
                          {r.confirmation_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-stone-900">
                        {r.guest?.first_name} {r.guest?.last_name}
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-500">
                        {r.check_in_date && formatDate(r.check_in_date)} → {r.check_out_date && formatDate(r.check_out_date)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-stone-700">{formatMAD(r.total_amount || 0)}</td>
                      <td className="px-6 py-4 text-right text-sm text-emerald-700">{formatMAD(r.amount_paid || 0)}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-red-600">{formatMAD(r.balance_due || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <AddPaymentDialog open={showAddPayment} onClose={() => setShowAddPayment(false)} />
      <AddExpenseDialog open={showAddExpense} onClose={() => setShowAddExpense(false)} />
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="hp-card p-12 text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-base font-heading font-semibold text-stone-700 mb-1">{title}</h3>
      <p className="text-sm text-stone-400">{desc}</p>
    </div>
  );
}
