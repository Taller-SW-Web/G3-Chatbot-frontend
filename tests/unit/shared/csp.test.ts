import { describe, expect, it } from "vitest";
import { apiOrigin, buildCsp } from "@/shared/security/csp";
import { resolveApiProxyTarget } from "@/shared/config/apiProxyTarget";

const directivas = (csp: string) => Object.fromEntries(csp.split("; ").map((d) => [d.split(" ")[0], d]));

describe("buildCsp", () => {
  it("prohíbe frames, plugins y base/form externos", () => {
    const d = directivas(buildCsp());
    expect(d["frame-ancestors"]).toBe("frame-ancestors 'none'");
    expect(d["object-src"]).toBe("object-src 'none'");
    expect(d["base-uri"]).toBe("base-uri 'self'");
    expect(d["form-action"]).toBe("form-action 'self'");
    expect(d["default-src"]).toBe("default-src 'self'");
  });

  it("permite imágenes https (catálogo y URLs firmadas) y data/blob, sin http", () => {
    const img = directivas(buildCsp())["img-src"];
    expect(img).toContain("https:");
    expect(img).toContain("data:");
    expect(img).toContain("blob:");
    expect(img).not.toMatch(/ http:/);
  });

  it("no incluye hosts inválidos ni localhost en producción", () => {
    const csp = buildCsp();
    expect(csp).not.toContain("*.api");
    expect(csp).not.toContain("localhost");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("en desarrollo permite eval y websockets", () => {
    const d = directivas(buildCsp({ isDev: true }));
    expect(d["script-src"]).toContain("'unsafe-eval'");
    expect(d["connect-src"]).toContain("ws:");
  });

  it("añade a connect-src solo el origen de un API absoluto", () => {
    const d = directivas(buildCsp({ apiBaseUrl: "https://api.ejemplo.pe/api/v1" }));
    expect(d["connect-src"]).toBe("connect-src 'self' https://api.ejemplo.pe");
  });

  it("ignora un API relativo, vacío o con esquema no http", () => {
    for (const v of ["/api/v1", "", null, undefined, "javascript:alert(1)", "no es url"]) {
      expect(apiOrigin(v)).toBeNull();
      expect(directivas(buildCsp({ apiBaseUrl: v }))["connect-src"]).toBe("connect-src 'self'");
    }
  });
});

describe("resolveApiProxyTarget", () => {
  it("falla si corre en Vercel sin API_PROXY_TARGET", () => {
    expect(() => resolveApiProxyTarget({ VERCEL: "1" })).toThrow(/API_PROXY_TARGET/);
    expect(() => resolveApiProxyTarget({ VERCEL: "1", API_PROXY_TARGET: "  " })).toThrow();
  });

  it("sin Vercel admite el valor ausente (sin proxy)", () => {
    expect(resolveApiProxyTarget({})).toBeUndefined();
  });

  it("devuelve el destino sin barras finales", () => {
    expect(resolveApiProxyTarget({ VERCEL: "1", API_PROXY_TARGET: "https://be.up.railway.app/" })).toBe(
      "https://be.up.railway.app",
    );
  });
});
