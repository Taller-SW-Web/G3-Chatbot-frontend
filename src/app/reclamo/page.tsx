import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { ReclamoPage } from "@/adapters/inbound/pages/ReclamoPage";

export default function ReclamoRoute() {
  return (
    <AppShell initialScreen="reclamo">
      <ReclamoPage />
    </AppShell>
  );
}
