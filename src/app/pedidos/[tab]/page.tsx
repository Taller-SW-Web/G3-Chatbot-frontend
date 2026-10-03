import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { OrderHistoryPage } from "@/adapters/inbound/pages/OrderHistoryPage";

const TABS = ["proceso", "entregados", "reembolso", "reclamos"] as const;
type Tab = (typeof TABS)[number];

/** `/pedidos/[tab]`: abre el historial directo en la pestaña (links desde el chat). */
export default async function PedidosTabRoute({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;
  const initialTab: Tab = (TABS as readonly string[]).includes(tab) ? (tab as Tab) : "proceso";
  return (
    <AppShell initialScreen="pedidos">
      <OrderHistoryPage initialTab={initialTab} />
    </AppShell>
  );
}
