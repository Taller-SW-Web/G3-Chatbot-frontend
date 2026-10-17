import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { VerificarCorreoPage } from "@/adapters/inbound/pages/VerificarCorreoPage";

/** `/verificar-correo?token=…`: el token se lee en el servidor y se pasa a la página client. */
export default async function VerificarCorreoRoute({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AppShell initialScreen="verificar-correo">
      <VerificarCorreoPage token={token} />
    </AppShell>
  );
}
