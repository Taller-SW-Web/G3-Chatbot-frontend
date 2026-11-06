import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { MiCuentaPage } from "@/adapters/inbound/pages/MiCuentaPage";
import { AuthGuard } from "@/adapters/inbound/components/AuthGuard";

export default function CuentaRoute() {
  return (
    <AppShell initialScreen="cuenta">
      <AuthGuard>
        <MiCuentaPage />
      </AuthGuard>
    </AppShell>
  );
}
