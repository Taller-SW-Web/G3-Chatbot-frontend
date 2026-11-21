import { Suspense } from "react";
import { AppShell } from "@/shared/ui/shell/AppShell";
import { AuthGuard } from "@/shared/auth/AuthGuard";
import { DevolucionPage } from "@/modules/mod-postventa/public";

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
