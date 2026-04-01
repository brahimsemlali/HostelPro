import { TopBar } from "@/components/layout/TopBar";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <TopBar title="Paramètres" />
      <main className="p-4 lg:p-6">
        <div className="max-w-lg mx-auto mt-16 text-center">
          <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Settings size={36} className="text-stone-400" />
          </div>
          <h2 className="text-xl font-heading font-semibold text-stone-800 mb-2">
            Paramètres
          </h2>
          <p className="text-sm text-stone-400 max-w-sm mx-auto">
            Configuration de l&apos;hébergement, équipe, tarifs et extras — disponible dans la prochaine version.
          </p>
        </div>
      </main>
    </>
  );
}
