import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { OrderHistoryPage } from "@/adapters/inbound/pages/OrderHistoryPage";

export default function PedidosRoute() {
  return (
    <AppShell initialScreen="pedidos">
      <OrderHistoryPage />
    </AppShell>
  );
}
