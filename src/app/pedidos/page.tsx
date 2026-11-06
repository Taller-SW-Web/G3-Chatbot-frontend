import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { OrderHistoryPage } from "@/adapters/inbound/pages/OrderHistoryPage";
import { AuthGuard } from "@/adapters/inbound/components/AuthGuard";

export default function PedidosRoute() {
  return (
    <AppShell initialScreen="pedidos">
      <AuthGuard>
        <OrderHistoryPage />
      </AuthGuard>
    </AppShell>
  );
}
