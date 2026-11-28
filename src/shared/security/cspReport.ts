/**
 * Parseo y saneado de reportes CSP. Sin dependencias de Next para poder probarlo
 * aislado; el route handler de `src/app/csp-report/route.ts` solo transporta.
 */

/** Tope de cuerpo aceptado: un reporte real pesa unos cientos de bytes. */
export const CSP_REPORT_MAX_BYTES = 16 * 1024;

/** Máximo de reportes procesados por request (evita floods de logs). */
export const CSP_REPORT_MAX_ITEMS = 20;

const MAX_FIELD_LENGTH = 200;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const URL_QUERY_OR_FRAGMENT = /[?#]/;

/** Resumen mínimo y sin datos sensibles de una violación CSP. */
export type CspReportSummary = {
  type: string;
  disposition: string;
  directive: string;
  documentUrl: string;
  blockedUrl: string;
};

type ReportObject = Record<string, unknown>;

function isObject(value: unknown): value is ReportObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function truncate(value: string): string {
  return value.length > MAX_FIELD_LENGTH ? `${value.slice(0, MAX_FIELD_LENGTH)}…` : value;
}

/** Texto de una sola línea, sin query string ni fragmento, acotado. */
function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  const plain = value.replace(CONTROL_CHARS, "").trim();
  if (!plain) return "";
  return truncate(plain.split(URL_QUERY_OR_FRAGMENT)[0] ?? plain);
}

function text(value: unknown): string {
  return typeof value === "string" ? truncate(value.replace(CONTROL_CHARS, "").trim()) : "";
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function summarizeLegacy(report: ReportObject): CspReportSummary {
  return {
    type: "csp-report",
    disposition: text(report.disposition),
    directive: text(firstString(report["effective-directive"], report["violated-directive"])),
    documentUrl: clean(firstString(report["document-uri"], report.documentURL)),
    blockedUrl: clean(firstString(report["blocked-uri"], report.blockedURL)),
  };
}

function summarizeReportingApi(item: ReportObject): CspReportSummary {
  const body = isObject(item.body) ? item.body : {};
  return {
    type: text(firstString(item.type, "csp-violation")) || "csp-violation",
    disposition: text(firstString(body.disposition, item.disposition)),
    directive: text(
      firstString(
        body.effectiveDirective,
        body["effective-directive"],
        body.violatedDirective,
        body["violated-directive"],
        body.directive
      )
    ),
    documentUrl: clean(firstString(body.documentURL, body["document-uri"], item.url)),
    blockedUrl: clean(firstString(body.blockedURL, body["blocked-uri"])),
  };
}

/**
 * Acepta los dos formatos vivos: `application/csp-report` (`{ "csp-report": … }`)
 * y `application/reports+json` (array de la Reporting API). Devuelve `null` si el
 * JSON no tiene una forma reconocible.
 */
export function parseCspReports(raw: string): CspReportSummary[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (isObject(parsed) && isObject(parsed["csp-report"])) {
    return [summarizeLegacy(parsed["csp-report"])];
  }

  if (!Array.isArray(parsed)) return null;
  const reports = parsed.filter(isObject).slice(0, CSP_REPORT_MAX_ITEMS);
  if (reports.length === 0 && parsed.length > 0) return null;
  return reports.map(summarizeReportingApi);
}

/** Tipos aceptados; `application/json` cubre proxies que reescriben el content-type. */
export function isCspReportContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const base = contentType.split(";")[0]?.trim().toLowerCase();
  return (
    base === "application/csp-report" ||
    base === "application/reports+json" ||
    base === "application/json"
  );
}
