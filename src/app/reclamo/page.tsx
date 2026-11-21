import { Suspense } from "react";
import { AppShell } from "@/shared/ui/shell/AppShell";
import { AuthGuard } from "@/shared/auth/AuthGuard";
import { ReclamoPage } from "@/modules/mod-postventa/public";

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
