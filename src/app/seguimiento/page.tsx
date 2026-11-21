import { Suspense } from "react";
import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { AuthGuard } from "@/adapters/inbound/components/AuthGuard";
import { SeguimientoPage } from "@/adapters/inbound/pages/SeguimientoPage";

export default function SeguimientoRoute() {
  return (
    <AppShell initialScreen="seguimiento">
      <AuthGuard>
        <Suspense fallback={<p className="p-6 text-[14px] text-text-secondary">Cargando seguimiento…</p>}>
          <SeguimientoPage />
        </Suspense>
      </AuthGuard>
    </AppShell>
  );
}
