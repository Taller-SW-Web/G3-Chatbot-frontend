import { AppShell } from "@/shared/ui/shell/AppShell";
import { CheckoutPage } from "@/modules/mod-checkout/public";
import { AuthGuard } from "@/shared/auth/AuthGuard";

export default function CheckoutRoute() {
  return (
    <AppShell initialScreen="checkout">
      <AuthGuard>
        <CheckoutPage />
      </AuthGuard>
    </AppShell>
  );
}
