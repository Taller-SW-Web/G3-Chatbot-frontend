/** CSP anti-XSS (token en LocalStorage, ADR-0008). Importable desde `next.config.ts`: sin alias `@/`. */

export type CspOptions = {
  /** Desarrollo: React necesita `eval` y el HMR usa websockets. */
  isDev?: boolean;
  /**
   * Origen absoluto del API si `NEXT_PUBLIC_API_BASE_URL` apunta fuera del mismo origen.
   * Un valor relativo (`/api/v1`) o vacío se ignora: ya lo cubre `'self'`.
   */
  apiBaseUrl?: string | null;
};

/** Endpoint same-origin que recibe los reportes CSP (`src/app/csp-report/route.ts`). */
export const CSP_REPORT_PATH = "/csp-report";

/** Nombre del grupo en `Reporting-Endpoints` y valor de la directiva `report-to`. */
export const CSP_REPORT_GROUP = "csp-endpoint";

/** Valor de la cabecera `Reporting-Endpoints` (Structured Fields: el nombre va sin comillas). */
export const CSP_REPORT_ENDPOINTS = `${CSP_REPORT_GROUP}="${CSP_REPORT_PATH}"`;

/** Devuelve el origen (`https://host`) de una URL absoluta http(s), o `null`. */
export function apiOrigin(apiBaseUrl: string | null | undefined): string | null {
  if (!apiBaseUrl) return null;
  try {
    const url = new URL(apiBaseUrl);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}

/**
 * Construye la política. Los scripts inline de arranque de Next exigen `'unsafe-inline'`
 * mientras no haya nonces (requieren render dinámico en todas las rutas): se endurecerá
 * después de observar los reportes. Las imágenes de catálogo y las URLs firmadas de
 * adjuntos (Supabase) vienen de hosts https variables, por eso `img-src` admite `https:`.
 *
 * `report-uri` cubre CSP2 y `report-to` usa Reporting API (CSP3) sobre HTTPS.
 * En desarrollo se omite `report-to` porque los navegadores no procesan
 * `Reporting-Endpoints` sobre HTTP y, al preferirlo sobre `report-uri`,
 * perderían el reporte. Ver `docs/seguridad/csp-reportes.md`.
 */
export function buildCsp({ isDev = false, apiBaseUrl = null }: CspOptions = {}): string {
  const origin = apiOrigin(apiBaseUrl);
  const connect = ["'self'", ...(origin ? [origin] : []), ...(isDev ? ["ws:", "http://localhost:*"] : [])];
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `connect-src ${connect.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    `report-uri ${CSP_REPORT_PATH}`,
    ...(isDev ? [] : [`report-to ${CSP_REPORT_GROUP}`]),
  ];
  return directives.join("; ");
}
