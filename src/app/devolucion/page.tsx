import { Suspense } from "react";
import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { AuthGuard } from "@/adapters/inbound/components/AuthGuard";
import { DevolucionPage } from "@/adapters/inbound/pages/DevolucionPage";

export default function DevolucionRoute() {
  return (
    <AppShell initialScreen="devolucion">
      <AuthGuard>
        <Suspense fallback={<p className="p-6 text-[14px] text-text-secondary">Cargando devolución…</p>}>
          <DevolucionPage />
        </Suspense>
      </AuthGuard>
    </AppShell>
  );
}
