import { Suspense } from "react";
import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { AuthGuard } from "@/adapters/inbound/components/AuthGuard";
import { ReclamoPage } from "@/adapters/inbound/pages/ReclamoPage";

export default function ReclamoRoute() {
  return (
    <AppShell initialScreen="reclamo">
      <AuthGuard>
        <Suspense fallback={<p className="p-6 text-[14px] text-text-secondary">Cargando reclamo…</p>}>
          <ReclamoPage />
        </Suspense>
      </AuthGuard>
    </AppShell>
  );
}
