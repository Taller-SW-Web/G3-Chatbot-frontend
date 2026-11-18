import { test, expect, type Page } from "@playwright/test";

/**
 * E2E de humo contra el stack real: Next + backend + PostgreSQL, con los módulos
 * externos en modo `fake` (ADR-0022), que es el modo con el que se demuestra el
 * producto. Sin `page.route`: todo pasa por la API de verdad.
 * Casos y trazabilidad: docs/casos-prueba-hito-3.md del repositorio de specs.
 *
 * Los flujos que dependen del LLM real viven en `chat.real.spec.ts` (nocturno).
 */

const MOVIL = { width: 390, height: 844 };

// Cuenta semilla de `src/adapters/outbound/fakes/seeds/security.json` (estado ACTIVO).
const CORREO = process.env.E2E_CORREO ?? "cliente@demo.pe";
const CLAVE = process.env.E2E_CLAVE ?? "Demo1234";

test.use({ viewport: MOVIL });

async function abrirBarraLateral(page: Page) {
  await page.goto("/");
  await page.getByLabel("Abrir menú").click();
}

/** El modal repite "INICIAR SESIÓN": se acota a la barra para no chocar con él. */
async function abrirLogin(page: Page) {
  await abrirBarraLateral(page);
  await page.locator("aside").getByText("Iniciar sesión").click();
}

test.describe("Hito 3 — humo", () => {
  // E2E-01 · CP-H3-05-06 (SPEC-05 Req. 2 · Primera apertura)
  test("E2E-01 la pantalla de inicio muestra el banner, las ofertas y el campo de conversación", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("ENCUENTRA TU")).toBeVisible();
    await expect(page.getByText("PRODUCTOS EN OFERTA")).toBeVisible();
    await expect(page.getByPlaceholder("Pregunta por zapatillas, tallas, pedidos…")).toBeVisible();
  });

  // E2E-02 · CP-H3-05-01, 05-02 y 05-03 (SPEC-05 Req. 1)
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

  // E2E-04 · CP-H3-01-06 (SPEC-01 Req. 3): registro y estado pendiente de verificación.
  // El canje del enlace vive en CP-H3-02-01 y necesita el token del buzón de pruebas.
  test("E2E-04 un visitante se registra y queda pendiente de verificar su correo", async ({ page }) => {
    const correo = `e2e+${Date.now()}@example.com`;
    await abrirLogin(page);
    await page.getByRole("button", { name: "CREAR CUENTA" }).click();

    await page.getByLabel("Nombres").fill("Cliente");
    await page.getByLabel("Apellidos").fill("E2E");
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Celular").fill("987654321");
    await page.getByLabel("Contraseña", { exact: true }).fill("Clave-Segura-2026");
    await page.getByLabel("Confirmar contraseña", { exact: true }).fill("Clave-Segura-2026");
    await page.getByRole("checkbox", { name: /Acepto los términos y condiciones/ }).check();
    await page.getByRole("button", { name: "REGISTRARSE" }).click();

    await expect(page.getByText("¡REVISA TU CORREO!")).toBeVisible();
    await expect(page.getByText(/Te enviamos un enlace a .* para activar tu cuenta/)).toBeVisible();

    // El reenvío responde neutro, sin revelar si la cuenta existe (SPEC-02 Req. 2).
    await page.getByRole("button", { name: "Reenviar correo" }).click();
    await expect(page.getByRole("status")).toBeVisible();
  });

  // E2E-05 · CP-H3-03-01 y CP-H3-03-16 (SPEC-03 Req. 1 y 6)
  test("E2E-05 un cliente inicia y cierra sesión", async ({ page }) => {
    await abrirLogin(page);
    await page.getByLabel("Correo").fill(CORREO);
    await page.getByLabel("Contraseña", { exact: true }).fill(CLAVE);
    await page.getByRole("button", { name: "ENTRAR" }).click();

    // Al autenticarse se reanuda la acción pendiente: la cuenta con sus datos.
    await expect(page).toHaveURL(/\/cuenta$/);
    await expect(page.getByText("Cliente Demo")).toBeVisible();
    await expect(page.getByText(CORREO)).toBeVisible();

    await page.getByRole("button", { name: "CERRAR SESIÓN" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.getByLabel("Abrir menú").click();
    await expect(page.locator("aside").getByText("Iniciar sesión")).toBeVisible();
  });
});
