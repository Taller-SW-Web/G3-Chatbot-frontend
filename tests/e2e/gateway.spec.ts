import { test, expect } from "@playwright/test";

/**
 * H5-G2 (ADR-0023, ADR-0031): verifica que el navegador solo realiza llamadas
 * a `/api/v1/*` en el mismo origen (enrutadas por el proxy de Next.js hacia
 * Kong OSS) y nunca llama directamente a un host externo del backend.
 *
 * En el job `e2e` de CI (sin Kong), este test valida el enrutamiento por mismo
 * origen. La verificación de las cabeceras del gateway (`PLAYWRIGHT_VERIFY_GATEWAY=true`)
 * se ejecuta de forma manual/post-despliegue contra Preview/Production en Vercel
 * como evidencia de cierre de #142.
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

    await page.goto("/", { waitUntil: "networkidle" });

    const appOrigin = new URL(page.url()).origin;
    for (const url of apiUrls) {
      const parsed = new URL(url);
      expect(parsed.origin).toBe(appOrigin);
      expect(parsed.pathname.startsWith("/api/v1/")).toBe(true);
    }

    // Llamada explícita sobre el mismo origen para no depender de qué endpoints dispare el home.
    const catalogResponse = await page.request.get(`${appOrigin}/api/v1/catalogo/productos`);
    expect(catalogResponse.status()).toBe(200);

    if (process.env.PLAYWRIGHT_VERIFY_GATEWAY === "true") {
      expect(catalogResponse.headers()["x-gateway"]).toBe("kong");
      expect(catalogResponse.headers()["x-request-id"]).toBeTruthy();
    }
  });
});
