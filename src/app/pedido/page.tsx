import { Suspense } from "react";
import { AppShell } from "@/shared/ui/shell/AppShell";
import { AuthGuard } from "@/shared/auth/AuthGuard";
import { PedidoContent } from "./PedidoContent";

/** `/pedido?pedidoId=...`: detalle del pedido con el CSAT inyectado como slot. */
export default function PedidoRoute() {
  return (
    <AppShell initialScreen="pedido">
      <AuthGuard>
        <Suspense fallback={<p className="p-6 text-[14px] text-text-secondary">Cargando pedido…</p>}>
          <PedidoContent />
        </Suspense>
      </AuthGuard>
    </AppShell>
  );
}
