import { TopBar } from "@/components/layout/TopBar";
import { TrendingUp } from "lucide-react";

export default function FinancesPage() {
  return (
    <>
      <TopBar title="Finances" />
      <main className="p-4 lg:p-6">
        <div className="max-w-lg mx-auto mt-16 text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <TrendingUp size={36} className="text-teal-400" />
          </div>
          <h2 className="text-xl font-heading font-semibold text-stone-800 mb-2">
            Module Finances
          </h2>
          <p className="text-sm text-stone-400 max-w-sm mx-auto">
            Paiements, dépenses, rapports financiers et exports PDF — disponible dans la prochaine version.
          </p>
        </div>
      </main>
    </>
  );
}
