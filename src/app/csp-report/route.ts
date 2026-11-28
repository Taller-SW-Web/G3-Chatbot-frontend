import {
  CSP_REPORT_MAX_BYTES,
  isCspReportContentType,
  parseCspReports,
} from "@/shared/security/cspReport";

export const dynamic = "force-dynamic";

/**
 * Colector de violaciones CSP (`report-uri`/`report-to`). No es una API de
 * producto: responde 204 y solo deja un resumen saneado en los logs del
 * servidor. Ver `docs/seguridad/csp-reportes.md`.
 */
export async function POST(request: Request) {
  if (!isCspReportContentType(request.headers.get("content-type"))) {
    return new Response(null, { status: 415 });
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > CSP_REPORT_MAX_BYTES) {
    return new Response(null, { status: 413 });
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > CSP_REPORT_MAX_BYTES) {
    return new Response(null, { status: 413 });
  }

  const reports = parseCspReports(raw);
  if (!reports) return new Response(null, { status: 400 });

  for (const report of reports) console.warn("[csp-report]", JSON.stringify(report));
  return new Response(null, { status: 204 });
}
