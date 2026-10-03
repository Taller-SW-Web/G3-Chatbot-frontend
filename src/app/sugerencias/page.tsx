import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { SugerenciasPage } from "@/adapters/inbound/pages/SugerenciasPage";

export default function SugerenciasRoute() {
  return (
    <AppShell initialScreen="sugerencias">
      <SugerenciasPage />
    </AppShell>
  );
}
