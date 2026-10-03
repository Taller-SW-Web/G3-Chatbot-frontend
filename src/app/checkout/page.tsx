import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { CheckoutPage } from "@/adapters/inbound/pages/CheckoutPage";

export default function CheckoutRoute() {
  return (
    <AppShell initialScreen="checkout">
      <CheckoutPage />
    </AppShell>
  );
}
