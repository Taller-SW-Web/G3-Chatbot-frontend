import { AppShell } from "@/shared/ui/shell/AppShell";
import { MiCuentaPage } from "@/modules/mod-auth/public";
import { AuthGuard } from "@/shared/auth/AuthGuard";

export default function CuentaRoute() {
  return (
    <AppShell initialScreen="cuenta">
      <AuthGuard>
        <MiCuentaPage />
      </AuthGuard>
    </AppShell>
  );
}
