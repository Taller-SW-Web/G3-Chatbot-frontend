import { test, expect } from "@playwright/test";

/**
 * H5-G2 (ADR-0023, ADR-0031): verifica que el navegador solo realiza llamadas
 * a `/api/v1/*` en el mismo origen (enrutadas por el proxy de Next.js hacia
 * Kong OSS) y nunca llama directamente a un host externo del backend.
 *
 * Cuando se ejecuta contra un entorno con Kong delante (`PLAYWRIGHT_VERIFY_GATEWAY=true`),
 * verifica además las cabeceras `x-gateway: kong` y `x-request-id`.
 */
test.describe("H5-G2 — enrutamiento por API Gateway", () => {
  test("todas las llamadas API salen por mismo origen /api/v1/* sin llamar directo al backend", async ({
    page,
  }) => {
    const apiUrls: string[] = [];

    page.on("request", (req) => {
      if (req.url().includes("/api/v1/")) {
        apiUrls.push(req.url());
      }
    });

    const catalogResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/v1/catalogo/") && res.status() === 200,
    );

    await page.goto("/");
    const catalogResponse = await catalogResponsePromise;
    const catalogGatewayHeader = catalogResponse.headers()["x-gateway"];
    const catalogRequestId = catalogResponse.headers()["x-request-id"];

    const appOrigin = new URL(page.url()).origin;
    expect(apiUrls.length).toBeGreaterThan(0);

    for (const url of apiUrls) {
      const parsed = new URL(url);
      expect(parsed.origin).toBe(appOrigin);
      expect(parsed.pathname.startsWith("/api/v1/")).toBe(true);
    }

    if (process.env.PLAYWRIGHT_VERIFY_GATEWAY === "true") {
      expect(catalogGatewayHeader).toBe("kong");
      expect(catalogRequestId).toBeTruthy();
    }
  });
});
