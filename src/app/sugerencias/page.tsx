import { AppShell } from "@/shared/ui/shell/AppShell";
import { SugerenciasPage } from "@/modules/mod-chat/public";

export default function SugerenciasRoute() {
  return (
    <AppShell initialScreen="sugerencias">
      <SugerenciasPage />
    </AppShell>
  );
}
