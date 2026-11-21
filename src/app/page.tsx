import { AppShell } from "@/shared/ui/shell/AppShell";
import { HomePage } from "@/modules/mod-catalog/public";

export default function HomeRoute() {
  return (
    <AppShell initialScreen="home">
      <HomePage />
    </AppShell>
  );
}
