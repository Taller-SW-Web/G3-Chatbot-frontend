import { test, expect, type Page } from "@playwright/test";

/**
 * Issue 1.8 / #8: recorrido completo mobile-first. Primero en viewport de
 * celular (390x844), luego tablet (820x1180) y desktop (1280x900).
 *
 * Todo el backend se sustituye con `page.route` para que el test sea
 * determinista y no dependa de Postgres ni del LLM. Los flujos contra el stack
 * real siguen en `smoke.spec.ts` (job E2E de CI).
 *
 * Límite conocido: Playwright no abre un teclado virtual del sistema. La prueba
 * emula su efecto reduciendo el viewport de layout (`interactive-widget`
 * `resizes-content`) y verifica que el compositor siga visible y conservando el
 * texto. Los gestos táctiles sí se envían como eventos táctiles reales por CDP.
 */

const conversationId = "11111111-1111-4111-8111-111111111111";

const product = {
  product_id: "fixture-shoe",
  name: "Zapatilla de prueba",
  brand: "Inka",
  price: "239.90",
  regular_price: "299.90",
  offer_price: "239.90",
  savings_pct: 20,
  offer_valid_until: "2099-12-01T00:00:00Z",
  availability: "DISPONIBLE",
  single_sku: "fixture-sku",
};

const carousel = {
  id: "carousel",
  tipo: "CARRUSEL_PRODUCTOS",
  datos: {
    variant: "cross_sell",
    titulo: "Completa tu equipo",
    productos: [1, 2, 3, 4].map((n) => ({
      ...product,
      product_id: `fixture-${n}`,
      name: `Complemento ${n}`,
      single_sku: `fixture-sku-${n}`,
    })),
  },
};

const cart = {
  lineas: [
    {
      item_id: "linea-1",
      sku: "fixture-sku",
      nombre: "Zapatilla de prueba",
      cantidad: 1,
      precio: 239.9,
      disponible: true,
    },
  ],
  subtotal: 239.9,
  descuentos: [],
  costoEnvio: null,
  total: 239.9,
  avisos: [],
};

const sse = [
  { event: "aceptado", data: { mensajeId: "mensaje-user" } },
  { event: "token", data: { texto: "Te muestro " } },
  { event: "token", data: { texto: "opciones" } },
  { event: "bloque", data: { bloque: carousel } },
  { event: "fin", data: { mensajeId: "mensaje-bot" } },
]
  .map(({ event, data }) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  .join("");

async function mockApi(page: Page, { historialVacio = true } = {}) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (path === "/api/v1/sesion/refresh") {
      return route.fulfill({ status: 401, json: { code: "TOKEN_INVALIDO" } });
    }
    if (path === "/api/v1/catalogo/promociones" && method === "GET") {
      return route.fulfill({ json: { items: [
        { promotion_id: "promo-1", name: "Cyber 10%", valid_from: "2026-11-01T05:00:00Z", valid_until: null },
        { promotion_id: "promo-2", name: "Running week", valid_from: "2026-11-01T05:00:00Z", valid_until: null },
      ] } });
    }
    if (path === "/api/v1/catalogo/productos" && method === "GET") {
      return route.fulfill({ json: { items: [product], total: 1 } });
    }
    if (path === `/api/v1/catalogo/productos/${product.product_id}` && method === "GET") {
      return route.fulfill({ json: product });
    }
    if (path === "/api/v1/chat/conversaciones" && method === "POST") {
      return route.fulfill({ status: 201, json: { conversacionId: conversationId } });
    }
    if (path === `/api/v1/chat/conversaciones/${conversationId}/mensajes`) {
      if (method === "GET") {
        return route.fulfill({ json: historialVacio ? [] : [{ id: "bot-1", conversacionId: conversationId, rol: "bot", texto: "Opciones", creadoEn: "2026-11-18T12:00:00Z", bloques: { blocks: [carousel] } }] });
      }
      return route.fulfill({ contentType: "text/event-stream", body: sse });
    }
    if (path === "/api/v1/carrito" && method === "GET") {
      return route.fulfill({ json: cart });
    }
    return route.fulfill({ json: [] });
  });
}

function cdp(page: Page) {
  return page.context().newCDPSession(page);
}

/** Swipe táctil real (CDP) entre dos puntos del elemento. */
async function swipe(page: Page, selector: string, dx: number, dy = 0) {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`Sin caja para ${selector}`);
  const x0 = box.x + box.width * 0.75;
  const y0 = box.y + box.height / 2;
  const client = await cdp(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: x0, y: y0 }],
  });
  for (let paso = 1; paso <= 6; paso++) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x0 + (dx * paso) / 6, y: y0 + (dy * paso) / 6 }],
    });
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}

const viewports = [
  { name: "celular 390x844", width: 390, height: 844, touch: true },
  { name: "tablet 820x1180", width: 820, height: 1180, touch: true },
  { name: "desktop 1280x900", width: 1280, height: 900, touch: false },
];

for (const viewport of viewports) {
  test.describe(`mobile-first · ${viewport.name}`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.touch,
      isMobile: viewport.touch,
    });

    test("recorrido completo: home → detalle → chat SSE → carrito", async ({ page }) => {
      await mockApi(page);
      await page.goto("/");

      await expect(page.getByText("PRODUCTOS EN OFERTA")).toBeVisible();
      await expect(page.getByText("S/ 239.90").first()).toBeVisible();

      // Detalle desde la tarjeta del home.
      await page.getByTestId("btn-detalle").first().click();
      const detalle = page.getByRole("dialog", { name: "Detalle de producto" });
      await expect(detalle).toBeVisible();
      await expect(detalle.getByText("Zapatilla de prueba")).toBeVisible();
      await expect(detalle.getByText("Precio no disponible")).toHaveCount(0);
      await page.getByRole("button", { name: "Cerrar detalle" }).click();

      // Enviar el primer mensaje crea la conversación y consume el SSE.
      await page.getByLabel("Mensaje").fill("Busco zapatillas para correr");
      await page.getByRole("button", { name: "Enviar" }).click();
      await expect(page).toHaveURL(new RegExp(`/chat/${conversationId}$`));
      await expect(page.getByText("Busco zapatillas para correr")).toBeVisible();
      await expect(page.getByText("Completa tu equipo")).toBeVisible();

      // Sin desbordes horizontales en ningún viewport.
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

      // Carrito real (mock) desde el header.
      await page.getByLabel("Ver carrito").click();
      await expect(page).toHaveURL(/\/carrito$/);
      await expect(page.getByTestId("cart-page")).toBeVisible();
      await expect(page.getByText("Zapatilla de prueba")).toBeVisible();
      await expect(page.getByText("Subtotal")).toBeVisible();
      await expect(page.getByText("S/ 239.90").first()).toBeVisible();
    });

    if (viewport.touch) {
      test("gestos táctiles: swipe del banner, drawer y carrusel", async ({ page }) => {
        await mockApi(page, { historialVacio: false });
        await page.goto("/");

        // Carrusel del banner: el swipe cambia el indicador.
        await expect(page.getByText("1 / 2")).toBeVisible();
        await swipe(page, "[data-testid='banner-ofertas']", -180);
        await expect(page.getByText("2 / 2")).toBeVisible();
        await expect(page.getByTestId("banner-promocion")).toHaveText("Running week");
        await swipe(page, "[data-testid='banner-ofertas']", 180);
        await expect(page.getByText("1 / 2")).toBeVisible();

        // Drawer: se abre con el botón y se cierra con swipe hacia la izquierda.
        await page.getByLabel("Abrir menú").click();
        const drawer = page.getByTestId("sidebar-drawer");
        await expect(drawer).toBeVisible();
        await swipe(page, "[data-testid='sidebar-drawer']", -260);
        await expect(drawer).toBeHidden();

        // Carrusel de productos del chat: scroll táctil horizontal.
        await page.goto(`/chat/${conversationId}`);
        const grupo = page.getByRole("group", { name: "Completa tu equipo" });
        await expect(grupo).toBeVisible();
        const antes = await grupo.evaluate((el) => el.scrollLeft);
        await swipe(page, "[role='group'][aria-label='Completa tu equipo']", -220);
        await expect.poll(() => grupo.evaluate((el) => el.scrollLeft)).toBeGreaterThan(antes);
      });
    }

    test("teclado virtual: el compositor sigue visible y conserva el texto", async ({ page }) => {
      await mockApi(page);
      await page.goto("/");

      const campo = page.getByLabel("Mensaje");
      await campo.focus();
      await campo.fill("Hola desde el celular");

      // El teclado de Android reduce el viewport de layout (resizes-content).
      await page.setViewportSize({ width: viewport.width, height: viewport.touch ? 420 : 600 });
      await expect(campo).toBeVisible();
      await expect(campo).toHaveValue("Hola desde el celular");

      const caja = await campo.boundingBox();
      expect(caja).not.toBeNull();
      expect(caja!.y).toBeGreaterThanOrEqual(0);
      expect(caja!.y + caja!.height).toBeLessThanOrEqual(viewport.touch ? 420 : 600);
    });
  });
}
