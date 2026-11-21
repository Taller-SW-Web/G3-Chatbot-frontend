import { Suspense } from "react";
import { AppShell } from "@/shared/ui/shell/AppShell";
import { AuthGuard } from "@/shared/auth/AuthGuard";
import { SeguimientoPage } from "@/modules/mod-orders/public";

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
