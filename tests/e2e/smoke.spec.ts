import { test, expect, type Page } from "@playwright/test";

/**
 * E2E de humo del Hito 3 (H3-16). Recorren el criterio de aceptación contra la app real:
 * sin page.route ni datos simulados, el backend responde de verdad.
 * Casos y trazabilidad: docs/casos-prueba-hito-3.md del repositorio de specs.
 *
 * Las pruebas en test.fixme esperan a que su funcionalidad se conecte al backend;
 * al cerrar la tarea indicada, su responsable las activa (test.fixme -> test).
 */

const MOVIL = { width: 390, height: 844 };

test.use({ viewport: MOVIL });

async function abrirBarraLateral(page: Page) {
  await page.goto("/");
  await page.getByLabel("Abrir menú").click();
}

test.describe("Hito 3 · humo", () => {
  // E2E-01 · CP-H3-05-06 (SPEC-05 Req. 2 · Primera apertura)
  test("E2E-01 la pantalla de inicio muestra el banner, las ofertas y el campo de conversación", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("ENCUENTRA TU")).toBeVisible();
    await expect(page.getByText("PRODUCTOS EN OFERTA")).toBeVisible();
    await expect(page.getByPlaceholder("Pregunta por zapatillas, tallas, pedidos…")).toBeVisible();
  });

  // E2E-02 · CP-H3-05-01, 05-02 y 05-03 (SPEC-05 Req. 1). Requiere H3-15 y la base de datos del entorno.
  test("E2E-02 la barra lateral lista, busca y crea conversaciones contra el backend", async ({ page }) => {
    await abrirBarraLateral(page);
    await expect(page.getByText("RECIENTES")).toBeVisible();
    // Recientes termina de cargar sin error (un visitante nuevo no tiene conversaciones).
    await expect(page.getByText("Cargando…")).toBeHidden();
    await expect(page.getByText("No se pudieron cargar las conversaciones.")).toBeHidden();

    await page.getByText("Buscar chats").click();
    await page.getByLabel("Buscar conversaciones").fill(`sin-coincidencias-${Date.now()}`);
    await expect(page.getByText("Sin resultados.")).toBeVisible();
    await page.getByLabel("Cerrar búsqueda").click();

    const creada = page.waitForResponse(
      (r) => r.url().endsWith("/api/v1/chat/conversaciones") && r.request().method() === "POST"
    );
    await page.getByText("Nuevo chat").click();
    expect((await creada).status()).toBe(201);
    await expect(page).toHaveURL(/\/chat\/[0-9a-f-]{36}$/);
  });

  // E2E-03 · CP-H3-05-08 y 05-14 (SPEC-05 Req. 2 y 4). Pendiente de H3-10 en el frontend.
  test.fixme("E2E-03 un mensaje desde el inicio recibe la respuesta del asistente en streaming", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Pregunta por zapatillas, tallas, pedidos…").fill("Hola, busco zapatillas para correr");
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

  // E2E-04 · CP-H3-01-06 y CP-H3-02-01 (SPEC-01 Req. 3, SPEC-02 Req. 1). Pendiente de H3-09.
  test.fixme("E2E-04 un visitante se registra y verifica su correo", async ({ page }) => {
    const correo = `e2e+${Date.now()}@example.com`;
    await abrirBarraLateral(page);
    await page.getByText("Iniciar sesión").click();
    await page.getByText("CREAR CUENTA").click();
    await page.getByLabel("Nombre completo").fill("Cliente E2E");
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Contraseña", { exact: true }).fill("Clave-Segura-2026");
    await page.getByLabel("Confirmar contraseña").fill("Clave-Segura-2026");
    await page.getByText("REGISTRARSE").click();
    await expect(page.getByText("Reenviar correo")).toBeVisible();
    // Falta definir cómo obtener el enlace de verificación en staging
    // (buzón de pruebas o token expuesto por el mock de Seguridad, ADR-0022).
  });

  // E2E-05 · CP-H3-03-01 y CP-H3-03-16 (SPEC-03 Req. 1 y 6). Pendiente de H3-14.
  test.fixme("E2E-05 un cliente inicia y cierra sesión", async ({ page }) => {
    const correo = process.env.E2E_CORREO ?? "";
    const clave = process.env.E2E_CLAVE ?? "";
    await abrirBarraLateral(page);
    await page.getByText("Iniciar sesión").click();
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Contraseña", { exact: true }).fill(clave);
    await page.getByText("ENTRAR").click();
    await page.getByLabel("Abrir menú").click();
    await expect(page.getByText("Iniciar sesión")).toBeHidden();
    await page.goto("/cuenta");
    await page.getByText("CERRAR SESIÓN").click();
    await page.getByLabel("Abrir menú").click();
    await expect(page.getByText("Iniciar sesión")).toBeVisible();
  });

  // E2E-06 · CP-H3-09-01 y CP-H3-09-06 (SPEC-09 Req. 1 y 3). Pendiente de H3-12.
  test.fixme("E2E-06 una búsqueda en el chat muestra el carrusel y el detalle del producto", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Pregunta por zapatillas, tallas, pedidos…").fill("zapatillas de running");
    await page.getByLabel("Enviar").click();
    const tarjeta = page.getByLabel(/^Ver detalle de /).first();
    await expect(tarjeta).toBeVisible({ timeout: 20_000 });
    await tarjeta.click();
    await expect(page.getByText(/S\/ \d+\.\d{2}/).first()).toBeVisible();
  });

  // E2E-07 · CP-H3-09-04 y CP-H3-11-09 (SPEC-09 Req. 2, SPEC-11 Req. 3). Pendiente de H3-13.
  test.fixme("E2E-07 agregar un producto desde la tarjeta lo muestra en el carrito", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Pregunta por zapatillas, tallas, pedidos…").fill("medias deportivas");
    await page.getByLabel("Enviar").click();
    await page.getByRole("button", { name: /^Agregar/ }).first().click();
    await page.getByLabel("Ver carrito").click();
    await expect(page).toHaveURL(/\/carrito$/);
    await expect(page.getByText("Subtotal").first()).toBeVisible();
    await expect(page.getByText(/S\/ \d+\.\d{2}/).first()).toBeVisible();
  });
});
