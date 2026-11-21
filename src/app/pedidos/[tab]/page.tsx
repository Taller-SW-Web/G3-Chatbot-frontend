import { AppShell } from "@/shared/ui/shell/AppShell";
import { OrderHistoryPage } from "@/modules/mod-orders/public";
import { AuthGuard } from "@/shared/auth/AuthGuard";

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
      <AuthGuard>
        <OrderHistoryPage initialTab={initialTab} />
      </AuthGuard>
    </AppShell>
  );
}
