import { AppShell } from "@/shared/ui/shell/AppShell";
import { SugerenciasPage } from "@/modules/mod-chat/public";
import { AuthGuard } from "@/shared/auth/AuthGuard";

export default function SugerenciasRoute() {
  return (
    <AppShell initialScreen="sugerencias">
      <AuthGuard>
        <SugerenciasPage />
      </AuthGuard>
    </AppShell>
  );
}
