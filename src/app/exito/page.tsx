import { AppShell } from "@/shared/ui/shell/AppShell";
import { OrderSuccessPage } from "@/modules/mod-checkout/public";

export default function ExitoRoute() {
  return (
    <AppShell initialScreen="exito">
      <OrderSuccessPage />
    </AppShell>
  );
}
