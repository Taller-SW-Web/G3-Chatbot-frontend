import { AppShell } from "@/shared/ui/shell/AppShell";
import { VerificarCorreoPage } from "@/modules/mod-auth/public";

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
