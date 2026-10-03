import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { OrderSuccessPage } from "@/adapters/inbound/pages/OrderSuccessPage";

export default function ExitoRoute() {
  return (
    <AppShell initialScreen="exito">
      <OrderSuccessPage />
    </AppShell>
  );
}
