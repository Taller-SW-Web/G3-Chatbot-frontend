import { AppShell } from "@/shared/ui/shell/AppShell";
import { OrderHistoryPage } from "@/modules/mod-orders/public";
import { AuthGuard } from "@/shared/auth/AuthGuard";

export default function PedidosRoute() {
  return (
    <AppShell initialScreen="pedidos">
      <AuthGuard>
        <OrderHistoryPage />
      </AuthGuard>
    </AppShell>
  );
}
