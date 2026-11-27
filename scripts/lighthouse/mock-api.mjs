#!/usr/bin/env node
/**
 * Mock mínimo del backend para Lighthouse (H5-P4 / #164).
 *
 * Lighthouse mide el UI, no la disponibilidad del backend. Sin este mock, las
 * consultas del catálogo y del carrito fallan, React Query reintenta una vez y
 * el aviso de error aparece ~1 s después: el LCP termina midiendo ese retraso y
 * no el render real de la pantalla.
 *
 * Solo responde las rutas públicas que consumen las URLs auditadas. Cualquier
 * otra ruta devuelve 404 con el mismo `code` que el backend.
 */
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

export const MOCK_API_PORT = 4010;

const EMPTY_CART = {
  lineas: [],
  subtotal: 0,
  descuentos: [],
  costoEnvio: null,
  envio: null,
  total: 0,
  avisos: [],
  promociones_ok: true,
};

const EMPTY_CATALOG = {
  items: [],
  total: 0,
  partial: false,
};

function json(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
  });
  response.end(body);
}

export function createMockApiServer() {
  return createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const path = url.pathname;

    if (request.method === "GET" && path === "/api/v1/catalogo/productos") {
      json(response, 200, EMPTY_CATALOG);
      return;
    }
    if (request.method === "GET" && path === "/api/v1/carrito") {
      json(response, 200, EMPTY_CART);
      return;
    }
    if (path === "/health") {
      json(response, 200, { status: "ok" });
      return;
    }

    json(response, 404, { code: "RECURSO_NO_ENCONTRADO" });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createMockApiServer().listen(MOCK_API_PORT, "127.0.0.1", () => {
    console.log(`mock api listening on http://127.0.0.1:${MOCK_API_PORT}`);
  });
}
