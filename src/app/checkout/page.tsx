import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { CheckoutPage } from "@/adapters/inbound/pages/CheckoutPage";
import { AuthGuard } from "@/adapters/inbound/components/AuthGuard";

export default function CheckoutRoute() {
  return (
    <AppShell initialScreen="checkout">
      <AuthGuard>
        <CheckoutPage />
      </AuthGuard>
    </AppShell>
  );
}
