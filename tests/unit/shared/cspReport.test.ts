import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CSP_REPORT_MAX_BYTES,
  isCspReportContentType,
  parseCspReports,
} from "@/shared/security/cspReport";
import { POST } from "@/app/csp-report/route";

const legacy = JSON.stringify({
  "csp-report": {
    "document-uri": "https://app.test/checkout?token=secreto#pago",
    "blocked-uri": "https://cdn.ejemplo.test/script.js?hash=1",
    "effective-directive": "script-src-elem",
    disposition: "report",
  },
});

const reportingApi = JSON.stringify([
  {
    type: "csp-violation",
    url: "https://app.test/cuenta?tab=datos",
    body: {
      documentURL: "https://app.test/cuenta?tab=datos#perfil",
      blockedURL: "inline",
      effectiveDirective: "script-src-elem",
      disposition: "report",
    },
  },
]);

function reportRequest(body: string, contentType = "application/csp-report") {
  return new Request("https://app.test/csp-report", {
    method: "POST",
    headers: { "content-type": contentType },
    body,
  });
}

describe("parseCspReports", () => {
  it("normaliza el formato legacy de report-uri y quita query/fragmento", () => {
    expect(parseCspReports(legacy)).toEqual([
      {
        type: "csp-report",
        disposition: "report",
        directive: "script-src-elem",
        documentUrl: "https://app.test/checkout",
        blockedUrl: "https://cdn.ejemplo.test/script.js",
      },
    ]);
  });

  it("normaliza el array de la Reporting API", () => {
    expect(parseCspReports(reportingApi)).toEqual([
      {
        type: "csp-violation",
        disposition: "report",
        directive: "script-src-elem",
        documentUrl: "https://app.test/cuenta",
        blockedUrl: "inline",
      },
    ]);
  });

  it("devuelve null para JSON inválido o con forma desconocida", () => {
    for (const raw of ["no es json", "{}", '{"csp-report":"texto"}', "[1,2]"]) {
      expect(parseCspReports(raw)).toBeNull();
    }
  });

  it("acepta una lista vacía y limita la cantidad de reportes", () => {
    expect(parseCspReports("[]")).toEqual([]);
    const muchos = JSON.stringify(Array.from({ length: 30 }, () => ({ type: "csp-violation" })));
    expect(parseCspReports(muchos)).toHaveLength(20);
  });

  it("limpia caracteres de control de los campos", () => {
    const reporte = JSON.stringify({
      "csp-report": {
        "document-uri": "https://app.test/a\nb",
        "effective-directive": "script-src\n",
      },
    });
    expect(parseCspReports(reporte)?.[0]).toMatchObject({
      documentUrl: "https://app.test/ab",
      directive: "script-src",
    });
  });
});

describe("isCspReportContentType", () => {
  it("acepta los tipos de CSP2, Reporting API y proxies JSON", () => {
    for (const tipo of [
      "application/csp-report",
      "application/reports+json; charset=utf-8",
      "application/json",
      " APPLICATION/CSP-REPORT ",
    ]) {
      expect(isCspReportContentType(tipo)).toBe(true);
    }
  });

  it("rechaza ausencia o tipos ajenos", () => {
    for (const tipo of [null, "", "text/plain", "application/x-www-form-urlencoded"]) {
      expect(isCspReportContentType(tipo)).toBe(false);
    }
  });
});

describe("POST /csp-report", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("acepta el reporte legacy, responde 204 y no filtra la URL completa", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const response = await POST(reportRequest(legacy));

    expect(response.status).toBe(204);
    expect(warn).toHaveBeenCalledTimes(1);
    const registrado = String(warn.mock.calls[0]?.[1]);
    expect(registrado).toContain("script-src-elem");
    expect(registrado).not.toContain("secreto");
  });

  it("acepta el array de la Reporting API", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const response = await POST(reportRequest(reportingApi, "application/reports+json"));

    expect(response.status).toBe(204);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("responde 204 sin logs para una lista vacía", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const response = await POST(reportRequest("[]", "application/reports+json"));

    expect(response.status).toBe(204);
    expect(warn).not.toHaveBeenCalled();
  });

  it("rechaza tipos de contenido ajenos sin leer el cuerpo", async () => {
    const response = await POST(reportRequest("{}", "text/plain"));
    expect(response.status).toBe(415);
  });

  it("rechaza JSON inválido", async () => {
    const response = await POST(reportRequest("{"));
    expect(response.status).toBe(400);
  });

  it("rechaza cuerpos por encima del tope", async () => {
    const response = await POST(reportRequest("x".repeat(CSP_REPORT_MAX_BYTES + 1)));
    expect(response.status).toBe(413);
  });
});
