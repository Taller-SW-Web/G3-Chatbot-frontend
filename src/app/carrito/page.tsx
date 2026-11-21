import { AppShell } from "@/shared/ui/shell/AppShell";
import { CartPage } from "@/modules/mod-cart/public";

export default function CarritoRoute() {
  return (
    <AppShell initialScreen="carrito">
      <CartPage />
    </AppShell>
  );
}
