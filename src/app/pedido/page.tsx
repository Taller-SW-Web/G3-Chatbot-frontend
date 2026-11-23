import { Suspense } from "react";
import { AppShell } from "@/shared/ui/shell/AppShell";
import { AuthGuard } from "@/shared/auth/AuthGuard";
import { OrderDetailPage } from "@/modules/mod-orders/public";

/** `/pedido?pedidoId=...`: detalle de un pedido, con CSAT al pie si está entregado. */
export default function PedidoRoute() {
  return (
    <AppShell initialScreen="pedido">
      <AuthGuard>
        <Suspense fallback={<p className="p-6 text-[14px] text-text-secondary">Cargando pedido…</p>}>
          <OrderDetailPage />
        </Suspense>
      </AuthGuard>
    </AppShell>
  );
}
