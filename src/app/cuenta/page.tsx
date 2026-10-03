import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { MiCuentaPage } from "@/adapters/inbound/pages/MiCuentaPage";

export default function CuentaRoute() {
  return (
    <AppShell initialScreen="cuenta">
      <MiCuentaPage />
    </AppShell>
  );
}
