import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { CartPage } from "@/adapters/inbound/pages/CartPage";

export default function CarritoRoute() {
  return (
    <AppShell initialScreen="carrito">
      <CartPage />
    </AppShell>
  );
}
