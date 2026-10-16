import { describe, it, expect, vi, beforeEach } from "vitest";

const peticiones = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: peticiones.get,
      post: peticiones.post,
      interceptors: { request: { use: () => {} } },
    }),
  },
}));

const memoria: Record<string, string> = {};
// zustand/persist espera localStorage también en entorno node.
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => memoria[k] ?? null,
    setItem: (k: string, v: string) => void (memoria[k] = v),
    removeItem: (k: string) => void delete memoria[k],
  },
  configurable: true,
});

import { chatbotApi } from "@/adapters/outbound/ChatbotApiAxiosAdapter";

describe("adapter Axios de catálogo (SPEC-06, SPEC-09, SPEC-10)", () => {
  beforeEach(() => {
    peticiones.get.mockReset();
    peticiones.post.mockReset();
  });

  it("búsqueda usa nombres reales y timeout de catálogo", async () => {
    peticiones.get.mockResolvedValueOnce({ data: { items: [], total: 0 } });
    await chatbotApi.buscarProductos({ q: "Nike", precioMin: 100, tamanio: 5 });
    expect(peticiones.get).toHaveBeenCalledWith(
      "/catalogo/productos",
      expect.objectContaining({
        params: expect.objectContaining({
          q: "Nike",
          precioMin: 100,
          tamanio: 5,
          pagina: 1,
        }),
        timeout: 4000,
      })
    );
  });

  it("detalle codifica el id y disponibilidad pasa cantidad", async () => {
    peticiones.get
      .mockResolvedValueOnce({ data: { product_id: "a/b" } })
      .mockResolvedValueOnce({ data: [{ sku: "X", status: "DISPONIBLE" }] });
    await chatbotApi.verDetalleProducto("a/b");
    expect(peticiones.get).toHaveBeenNthCalledWith(
      1,
      "/catalogo/productos/a%2Fb",
      expect.objectContaining({ timeout: 4000 })
    );
    await chatbotApi.consultarDisponibilidad("X", 2);
    expect(peticiones.get).toHaveBeenNthCalledWith(
      2,
      "/catalogo/disponibilidad",
      expect.objectContaining({ params: { sku: "X", cantidad: 2 } })
    );
  });

  it("sin fallback: el error llega a la UI por code", async () => {
    peticiones.get.mockRejectedValueOnce({
      response: { status: 409, data: { code: "PRODUCTO_NO_DISPONIBLE" } },
    });
    await expect(chatbotApi.verDetalleProducto("x")).rejects.toBeTruthy();
  });

  it("agregar usa el endpoint real del carrito", async () => {
    peticiones.post.mockResolvedValueOnce({ data: {} });
    await chatbotApi.agregarAlCarrito({ sku: "X", cantidad: 1 });
    expect(peticiones.post).toHaveBeenCalledWith(
      "/carrito/items",
      { sku: "X", cantidad: 1 },
      expect.objectContaining({ timeout: 4000 })
    );
  });
});
