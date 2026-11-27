import { test, expect, type Page, type Route } from "@playwright/test";

// M5 task 4.3 (specs#64): orders and claims journey in the chat, with backend-less fixtures.
// The BFF answers come from the M5 delta contract (same `datos` as chat-blocks-py.test.tsx);
// CI has no LLM, so each text turn is scripted as the block the tool would return.
const conversationId = "22222222-2222-4222-8222-222222222222";
const pedido = { pedidoId: "PED-2026-00891", fecha: "15/11/2026 10:30", total: "S/ 289.90", estado: "DESPACHADO", estadoEtiqueta: "En camino", canal: "WEB" };
const hitos = [{ titulo: "Pedido creado", fecha: "15/11/2026 10:30", done: true }, { titulo: "Pedido despachado", fecha: "16/11/2026 09:00", done: true }];
const seguimiento = { estado: "EN_CAMINO", estadoEtiqueta: "En camino", fechaProgramada: "17/11/2026", distrito: "Lima", recibidoPor: null, detalleDisponible: true, mensaje: null, hitos: [{ titulo: "En ruta al domicilio", fecha: "16/11/2026 08:00", completado: true }] };
const reclamo = { codigoSeguimiento: "REC-2026-0042", fecha: "20/11/2026 09:15", pedidoId: "PED-2026-00891", tipo: "RECLAMO", motivo: "Producto defectuoso", estado: "EN_PROCESO", estadoEtiqueta: "En proceso", fechaLimiteSLA: "11/12/2026" };
const respuesta = "Revisamos tu caso con calidad. El cambio se aprueba y sale mañana; no requiere pago.";

const listaPedidos = { id: "lp", tipo: "LISTA_PEDIDOS", datos: { pedidos: [pedido, { ...pedido, pedidoId: "PED-2026-00902", estado: "ENTREGADO", estadoEtiqueta: "Entregado" }] } };
const estadoPedido = { id: "ep", tipo: "ESTADO_PEDIDO", datos: { pedido, hitos } };
const estadoConSeguimiento = { id: "es", tipo: "ESTADO_PEDIDO", datos: { pedido, hitos, seguimiento } };
const listaReclamos = { id: "lr", tipo: "LISTA_RECLAMOS", datos: { reclamos: [reclamo, { ...reclamo, codigoSeguimiento: "REC-2026-0050", estado: "RESUELTO", estadoEtiqueta: "Resuelto" }] } };
const estadoReclamo = { id: "er", tipo: "ESTADO_RECLAMO", datos: { ...reclamo, respuestaVisibleCliente: respuesta } };

const porTexto: Record<string, unknown> = { "mis pedidos": listaPedidos, "¿ya viene?": estadoConSeguimiento, "mis reclamos": listaReclamos };
const porAccion: Record<string, unknown> = { CONSULTAR_PEDIDOS: estadoPedido, CONSULTAR_RECLAMO: estadoReclamo };

/** Stateful BFF stand-in: every turn is appended to the history that the chat reloads. */
async function bff(page: Page) {
  const historial: unknown[] = [];
  const enviados: unknown[] = [];
  const turno = (texto: string, bloque: unknown) => {
    const id = `fixture-bot-${historial.length}`;
    historial.push({ id, conversacionId: conversationId, rol: "bot", texto, creadoEn: "2026-11-26T12:00:00Z", bloques: { blocks: [bloque] } });
    return id;
  };
  await page.route("**/api/v1/**", (route) => route.fulfill({ json: new URL(route.request().url()).pathname.endsWith("/carrito") ? { lineas: [], subtotal: 0, descuentos: [], costoEnvio: null, total: 0, avisos: [] } : [] }));
  await page.route(`**/api/v1/chat/conversaciones/${conversationId}/mensajes`, async (route: Route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: historial });
    const input = route.request().postDataJSON();
    enviados.push(input);
    if (input.accion) {
      const bloque = porAccion[input.accion.tipo];
      const mensajeId = turno("", bloque);
      return route.fulfill({ json: { code: "OK", mensajeId, texto: "", bloques: [bloque], datos: {} } });
    }
    const bloque = porTexto[input.texto];
    const mensajeId = turno("", bloque);
    const events = [{ event: "aceptado", data: { mensajeId: `fixture-user-${historial.length}` } }, { event: "bloque", data: { bloque } }, { event: "fin", data: { mensajeId } }];
    await route.fulfill({ contentType: "text/event-stream", body: events.map(({ event, data }) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join("") });
  });
  return enviados;
}

async function escribir(page: Page, texto: string) {
  await page.getByLabel("Mensaje").fill(texto);
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
}

test("fixture pedidos y reclamos en el chat: lista, estado, seguimiento, reclamos y estado del reclamo", async ({ page }) => {
  const enviados = await bff(page);
  await page.goto(`/chat/${conversationId}`);

  await escribir(page, "mis pedidos");
  const lista = page.getByTestId("bloque-lista-pedidos");
  await expect(lista.getByText("Pedido PED-2026-00891")).toBeVisible();
  await expect(lista.getByText("Entregado")).toBeVisible();

  await lista.getByRole("button", { name: "VER PEDIDO" }).first().click();
  const estado = page.getByTestId("bloque-estado-pedido").first();
  await expect(estado.getByText("Pedido despachado")).toBeVisible();
  expect(enviados).toContainEqual({ accion: { tipo: "CONSULTAR_PEDIDOS", payload: { pedidoId: "PED-2026-00891" } } });

  await escribir(page, "¿ya viene?");
  const tracking = page.getByTestId("bloque-seguimiento");
  await expect(tracking.getByText("Seguimiento del despacho")).toBeVisible();
  await expect(tracking.getByText("En ruta al domicilio")).toBeVisible();
  await expect(page.getByRole("link", { name: "VER SEGUIMIENTO" })).toHaveAttribute("href", "/seguimiento?pedidoId=PED-2026-00891");

  await escribir(page, "mis reclamos");
  const reclamos = page.getByTestId("bloque-lista-reclamos");
  await expect(reclamos.getByText("Reclamo REC-2026-0042")).toBeVisible();
  await expect(reclamos.getByText("Resuelto")).toBeVisible();

  await reclamos.getByRole("button", { name: "VER RECLAMO" }).first().click();
  await expect(page.getByTestId("bloque-estado-reclamo").getByText(respuesta)).toBeVisible();
  expect(enviados).toContainEqual({ accion: { tipo: "CONSULTAR_RECLAMO", payload: { codigoSeguimiento: "REC-2026-0042" } } });

  // Each block is still there after reloading the persisted history.
  await page.reload();
  for (const testId of ["bloque-lista-pedidos", "bloque-seguimiento", "bloque-lista-reclamos", "bloque-estado-reclamo"]) {
    await expect(page.getByTestId(testId).first()).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
