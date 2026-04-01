import { TopBar } from "@/components/layout/TopBar";
import { Wrench } from "lucide-react";

export default function HousekeepingPage() {
  return (
    <>
      <TopBar title="Opérations" />
      <main className="p-4 lg:p-6">
        <div className="max-w-lg mx-auto mt-16 text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Wrench size={36} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-heading font-semibold text-stone-800 mb-2">
            Module Opérations
          </h2>
          <p className="text-sm text-stone-400 max-w-sm mx-auto">
            Tâches de ménage, maintenance et gestion des stocks — disponible dans la prochaine version.
          </p>
        </div>
      </main>
    </>
  );
}
