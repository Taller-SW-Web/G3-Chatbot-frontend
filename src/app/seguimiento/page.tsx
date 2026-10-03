import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { SeguimientoPage } from "@/adapters/inbound/pages/SeguimientoPage";

export default function SeguimientoRoute() {
  return (
    <AppShell initialScreen="seguimiento">
      <SeguimientoPage />
    </AppShell>
  );
}
