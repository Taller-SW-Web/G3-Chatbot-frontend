import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { DevolucionPage } from "@/adapters/inbound/pages/DevolucionPage";

export default function DevolucionRoute() {
  return (
    <AppShell initialScreen="devolucion">
      <DevolucionPage />
    </AppShell>
  );
}
