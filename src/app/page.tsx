import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { HomePage } from "@/adapters/inbound/pages/HomePage";

export default function HomeRoute() {
  return (
    <AppShell initialScreen="home">
      <HomePage />
    </AppShell>
  );
}
