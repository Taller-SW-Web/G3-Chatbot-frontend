/**
 * Destino del proxy `/api/*` (ADR-0023). En Vercel un destino ausente deja la app sin
 * backend (todas las llamadas devuelven 404), así que el build debe fallar. En local
 * y en CI sin Vercel se admite vacío: no hay proxy.
 */
export function resolveApiProxyTarget(env: Record<string, string | undefined>): string | undefined {
  const target = env.API_PROXY_TARGET?.trim() || undefined;
  if (!target && env.VERCEL) {
    throw new Error(
      "API_PROXY_TARGET es obligatoria en Vercel: sin ella el proxy /api queda desactivado y la app no llega al backend. " +
        "Defínela en las variables de entorno del proyecto (por ejemplo https://<backend>.up.railway.app).",
    );
  }
  return target?.replace(/\/+$/, "");
}
