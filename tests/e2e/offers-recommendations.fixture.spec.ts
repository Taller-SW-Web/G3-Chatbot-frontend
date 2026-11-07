import { test, expect, type Page } from "@playwright/test";

// Explicit backend-less fixtures. This suite never establishes G6 integration.
const conversationId = "11111111-1111-4111-8111-111111111111";
const product = { product_id: "fixture-shoe", name: "Zapatilla de prueba", price: "239.90", regular_price: "299.90", offer_price: "239.90", savings_pct: 20, offer_valid_until: "2099-12-01T00:00:00Z", availability: "INDETERMINADO", recommendation_reason: "Para correr en asfalto", single_sku: "fixture-sku" };
const promotions = { id: "p", tipo: "LISTA_PROMOCIONES", datos: { promociones: [{ promotion_id: "fixture-promo", name: "Campaña de prueba", valid_from: "2026-11-01T02:00:00Z", valid_until: null }] } };
const crossSell = { id: "c", tipo: "CARRUSEL_PRODUCTOS", datos: { variant: "cross_sell", titulo: "Completa tu equipo", productos: [1, 2, 3, 4].map((n) => ({ ...product, product_id: `fixture-${n}`, name: `Complemento ${n}` })) } };
const silence = { id: "a", tipo: "ACCIONES_RAPIDAS", acciones: [{ id: "SILENCIAR_COMPLEMENTOS", etiqueta: "No gracias", payload: {} }] };
const emptyCart = { lineas: [], subtotal: 0, descuentos: [], costoEnvio: null, total: 0, avisos: [] };
function history(blocks: unknown[]) {
  return [{ id: "fixture-bot", conversacionId: conversationId, rol: "bot", texto: "Respuesta de prueba", creadoEn: "2026-11-05T12:00:00Z", bloques: { blocks } }];
}
async function defaults(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({ json: path.endsWith("/carrito") ? emptyCart : [] });
  });
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
  test(`fixture home offered products ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await defaults(page);
    let onlyOffers: string | null = null;
    await page.route("**/api/v1/catalogo/productos?*", async (route) => {
      onlyOffers = new URL(route.request().url()).searchParams.get("soloOfertas");
      await route.fulfill({ json: { items: [product, { ...product, product_id: "missing", name: "Sin precio de prueba", price: null }], total: 2 } });
    });
    await page.goto("/");
    await expect(page.getByText("20% de ahorro")).toBeVisible();
    expect(onlyOffers).toBe("true");
    await expect(page.getByText("S/ 299.90")).toBeVisible();
    await expect(page.getByText("Precio no disponible")).toBeVisible();
    await expect(page.getByRole("button", { name: "Elegir talla y color de Sin precio de prueba" })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`offers-${viewport.width}.png`), fullPage: true, animations: "disabled" });
  });
}

test("fixture home distinguishes error from empty and retries", async ({ page }) => {
  await defaults(page);
  let failed = true;
  await page.route("**/api/v1/catalogo/productos?*", async (route) => {
    await route.fulfill(failed ? { status: 503, json: { code: "SERVICIO_NO_DISPONIBLE" } } : { json: { items: [], total: 0 } });
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Reintentar", exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("No hay productos en oferta ahora mismo.")).toBeHidden();
  failed = false;
  await page.getByRole("button", { name: "Reintentar", exact: true }).click();
  await expect(page.getByText("No hay productos en oferta ahora mismo.")).toBeVisible();
});

test("fixture cross-sell forwards silence once, locks pending controls and reloads persisted response", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await defaults(page);
  let silenced = false;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const actions: unknown[] = [];
  await page.route(`**/api/v1/chat/conversaciones/${conversationId}/mensajes`, async (route) => {
    if (route.request().method() === "POST") {
      actions.push(route.request().postDataJSON());
      await gate;
      silenced = true;
      await route.fulfill({ json: { texto: "Preferencia guardada", bloques: [] } });
    } else {
      await route.fulfill({ json: history(silenced ? [promotions] : [promotions, crossSell, silence]) });
    }
  });
  await page.goto(`/chat/${conversationId}`);
  await expect(page.getByText("Campaña de prueba")).toBeVisible();
  await expect(page.getByText("Complemento 1", { exact: true })).toBeVisible();
  await expect(page.getByText("Complemento 4", { exact: true })).toBeHidden();
  await expect(page.getByText("Para correr en asfalto")).toHaveCount(3);
  await page.screenshot({ path: test.info().outputPath("cross-sell-mobile.png"), fullPage: true, animations: "disabled" });
  await page.getByRole("button", { name: "No gracias", exact: true }).click();
  await expect(page.getByRole("button", { name: "No gracias", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Enviar", exact: true })).toBeDisabled();
  expect(actions).toEqual([{ accion: { tipo: "SILENCIAR_COMPLEMENTOS", payload: {} } }]);
  release();
  await expect(page.getByText("Completa tu equipo")).toBeHidden();
  await page.reload();
  await expect(page.getByText("Campaña de prueba")).toBeVisible();
  await expect(page.getByText("Completa tu equipo")).toBeHidden();
  expect(actions).toHaveLength(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("fixture clarification sends accumulated payload and stream renders offers with reload", async ({ page }) => {
  await defaults(page);
  let streamed = false;
  let chosen: unknown;
  const recommendation = { id: "r", tipo: "CARRUSEL_PRODUCTOS", datos: { variant: "recomendacion", titulo: "Para tu actividad", productos: [product] } };
  const chips = { id: "q", tipo: "ACCIONES_RAPIDAS", pregunta: "¿Dónde corres?", acciones: ["Asfalto", "Tierra"].map((label) => ({ id: "RECOMENDAR_PRODUCTOS", etiqueta: label, payload: { actividad: "running", nivel: "principiante", superficie: label.toLowerCase() } })) };
  await page.route(`**/api/v1/chat/conversaciones/${conversationId}/mensajes`, async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: history(streamed ? [recommendation, promotions] : [chips]) });
    const input = route.request().postDataJSON();
    if (input.accion) { chosen = input; return route.fulfill({ json: { texto: "Perfil recibido", bloques: [] } }); }
    streamed = true;
    const events = [{ event: "aceptado", data: { mensajeId: "fixture-user" } }, { event: "bloque", data: { bloque: recommendation } }, { event: "bloque", data: { bloque: promotions } }, { event: "fin", data: { mensajeId: "fixture-streamed-bot" } }];
    await route.fulfill({ contentType: "text/event-stream", body: events.map(({ event, data }) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join("") });
  });
  await page.goto(`/chat/${conversationId}`);
  await page.getByRole("button", { name: "Asfalto", exact: true }).click();
  await expect.poll(() => chosen).toEqual({ accion: { tipo: "RECOMENDAR_PRODUCTOS", payload: { actividad: "running", nivel: "principiante", superficie: "asfalto" } } });
  await expect(page.getByRole("button", { name: "Tierra", exact: true })).toBeEnabled();
  await page.getByLabel("Mensaje").fill("Muéstrame opciones");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.getByText("Para tu actividad")).toBeVisible();
  await expect(page.getByText("20% de ahorro")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Para correr en asfalto")).toBeVisible();
  await expect(page.getByText("Campaña de prueba")).toBeVisible();
});

for (const width of [390, 1280]) {
  test(`fixture promotion validation and Lima dates ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await defaults(page);
    let rows: unknown = [null, { promotion_id: " ", name: "Invalid", valid_from: "bad", valid_until: null },
      { ...promotions.datos.promociones[0], valid_until: "2027-01-01T02:00:00Z", coupon_code: "PRIVATE" }];
    await page.route(`**/api/v1/chat/conversaciones/${conversationId}/mensajes`, async (route) => {
      await route.fulfill({ json: history([{ ...promotions, datos: { promociones: rows } }]) });
    });
    await page.goto(`/chat/${conversationId}`);
    await expect(page.getByText("Desde el 31/10/2026 hasta el 31/12/2026")).toBeVisible();
    await expect(page.getByText("PRIVATE")).toHaveCount(0);
    rows = [null];
    await page.reload();
    await expect(page.getByText(/No pudimos mostrar las promociones/)).toBeVisible();
    rows = [];
    await page.reload();
    await expect(page.getByText(/No hay promociones vigentes/)).toBeVisible();
  });
}
