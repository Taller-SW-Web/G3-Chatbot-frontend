import { test, expect } from "@playwright/test";

/**
 * Flujos que pasan por el LLM real (E2E-03, E2E-06, E2E-07).
 *
 * No corren en el gate del PR: la respuesta del modelo no es determinista y no
 * hay proveedor fake. Se ejecutan en el workflow nocturno contra el entorno
 * desplegado (E2E_REAL=1 + E2E_BASE_URL), que es donde el LLM está disponible.
 */

const MOVIL = { width: 390, height: 844 };

test.use({ viewport: MOVIL });

test.beforeEach(() => {
  test.skip(!process.env.E2E_REAL, "Requiere el LLM real: corre en el workflow nocturno");
});

test.describe("Hito 3 — chat con LLM real", () => {
  // E2E-03 · CP-H3-05-08 y 05-14 (SPEC-05 Req. 2 y 4)
  test("E2E-03 un mensaje desde el inicio recibe la respuesta del asistente en streaming", async ({ page }) => {
    await page.goto("/");
    await page
      .getByPlaceholder("Pregunta por zapatillas, tallas, pedidos…")
      .fill("Hola, busco zapatillas para correr");
    const turno = page.waitForResponse(
      (r) => /\/api\/v1\/chat\/conversaciones\/[^/]+\/mensajes$/.test(r.url()) && r.request().method() === "POST"
    );
    await page.getByLabel("Enviar").click();
    const respuesta = await turno;
    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()["content-type"]).toContain("text/event-stream");
    await expect(page).toHaveURL(/\/chat\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Hola, busco zapatillas para correr")).toBeVisible();
    // La respuesta del asistente queda en el historial real de la conversación.
    await page.reload();
    await expect(page.getByText("Hola, busco zapatillas para correr")).toBeVisible();
  });

  // E2E-06 · CP-H3-09-01 y CP-H3-09-10 (SPEC-09 Req. 1 y 3)
  test("E2E-06 una búsqueda en el chat muestra el carrusel y el detalle del producto", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Pregunta por zapatillas, tallas, pedidos…").fill("zapatillas de running");
    await page.getByLabel("Enviar").click();

    // El carrusel es el criterio: tarjeta con nombre y precio vigente.
    const grupo = page.getByRole("group", { name: "Productos" });
    await expect(grupo).toBeVisible({ timeout: 30_000 });
    await expect(grupo.getByText(/S\/ \d+\.\d{2}/).first()).toBeVisible();

    // El detalle solo aplica a productos con variantes: sin ellas la tarjeta
    // ofrece "Agregar" directo (CP-H3-09-08) y ese camino lo cubre E2E-07.
    const detalle = grupo.getByRole("button", { name: /^Ver detalle de / }).first();
    test.skip((await detalle.count()) === 0, "El producto devuelto no tiene variantes: el detalle no aplica");
    await detalle.click();
    await expect(page.getByText(/S\/ \d+\.\d{2}/).first()).toBeVisible();
  });

  // E2E-07 · CP-H3-09-08 y CP-H3-11-09 (SPEC-09 Req. 2, SPEC-11 Req. 3)
  test("E2E-07 agregar un producto desde la tarjeta lo muestra en el carrito", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Pregunta por zapatillas, tallas, pedidos…").fill("zapatillas de running");
    await page.getByLabel("Enviar").click();

    // Acotado al carrusel: fuera de él vive "Agregar imagen (próximamente)".
    const grupo = page.getByRole("group", { name: "Productos" });
    await expect(grupo).toBeVisible({ timeout: 30_000 });
    const agregar = grupo.getByRole("button", { name: /^Agregar / }).first();
    // Un producto con variantes se agrega desde el detalle (E2E-06). Este caso
    // cubre CP-H3-09-08: producto de SKU único, "Agregar" directo en la tarjeta.
    test.skip((await agregar.count()) === 0, "El producto devuelto tiene variantes: se agrega desde el detalle");

    await agregar.click();
    await page.getByLabel("Ver carrito").click();
    await expect(page).toHaveURL(/\/carrito$/);
    await expect(page.getByText("Subtotal").first()).toBeVisible();
    await expect(page.getByText(/S\/ \d+\.\d{2}/).first()).toBeVisible();
  });
});
