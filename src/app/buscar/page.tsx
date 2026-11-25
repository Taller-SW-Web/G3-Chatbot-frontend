import { AppShell } from "@/shared/ui/shell/AppShell";
import { SearchChatsPage } from "@/modules/mod-chat/public";

export default async function BuscarRoute({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const q = Array.isArray(params.q) ? params.q[0] ?? "" : params.q ?? "";
  return (
    <AppShell initialScreen="buscar">
      <SearchChatsPage qInicial={q} />
    </AppShell>
  );
}
