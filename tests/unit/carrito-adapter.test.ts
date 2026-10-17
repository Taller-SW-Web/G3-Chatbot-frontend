import { describe, it, expect, vi, beforeEach } from "vitest";

const peticiones = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }));

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: peticiones.get,
      post: peticiones.post,
      patch: peticiones.patch,
      delete: peticiones.delete,
      interceptors: {
        request: { use: () => {} },
        response: { use: () => {} },
      },
    }),
    isAxiosError: (e: unknown) =>
      Boolean((e as { response?: unknown } | null)?.response),
  },
}));

const memoria: Record<string, string> = {};
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => memoria[k] ?? null,
    setItem: (k: string, v: string) => void (memoria[k] = v),
    removeItem: (k: string) => void delete memoria[k],
  },
  configurable: true,
});

import { chatbotApi } from "@/adapters/outbound/ChatbotApiAxiosAdapter";

const CARRITO = {
  lineas: [
    {
      item_id: "l1",
      sku: "SKU-1",
      nombre: "Zapatilla",
      cantidad: 2,
      precio: 100,
      disponible: true,
    },
  ],
  subtotal: 200,
  descuentos: [],
  costoEnvio: null,
  total: 200,
  avisos: [],
};

describe("adapter Axios del carrito (SPEC-10, SPEC-11)", () => {
  beforeEach(() => {
    peticiones.get.mockReset();
    peticiones.post.mockReset();
    peticiones.patch.mockReset();
    peticiones.delete.mockReset();
  });

  it("listar usa GET /carrito con conversacionId y timeout de catálogo", async () => {
    peticiones.get.mockResolvedValueOnce({ data: CARRITO });
    await chatbotApi.listarCarrito("conv-1");
    expect(peticiones.get).toHaveBeenCalledWith(
      "/carrito",
      expect.objectContaining({ params: { conversacionId: "conv-1" }, timeout: 4000 })
    );
  });

  it("actualizar usa PATCH con cantidad y devuelve el carrito", async () => {
    peticiones.patch.mockResolvedValueOnce({ data: { carrito: CARRITO } });
    const out = await chatbotApi.actualizarCantidadCarrito("l1", 3, "conv-1");
    expect(peticiones.patch).toHaveBeenCalledWith(
      "/carrito/items/l1",
      { cantidad: 3 },
      expect.objectContaining({ params: { conversacionId: "conv-1" } })
    );
    expect(out.subtotal).toBe(200);
  });

  it("eliminar usa DELETE por item_id", async () => {
    peticiones.delete.mockResolvedValueOnce({ data: { mensaje: "Quité X." } });
    await chatbotApi.eliminarLineaCarrito("l1", "conv-1");
    expect(peticiones.delete).toHaveBeenCalledWith(
      "/carrito/items/l1",
      expect.objectContaining({ params: { conversacionId: "conv-1" } })
    );
  });

  it("vaciar exige confirmado:true y sin fallback", async () => {
    peticiones.delete.mockResolvedValueOnce({ data: { mensaje: "Vaciamos tu carrito." } });
    await chatbotApi.vaciarCarrito("conv-1");
    expect(peticiones.delete).toHaveBeenCalledWith(
      "/carrito",
      expect.objectContaining({ data: { confirmado: true } })
    );
    peticiones.delete.mockRejectedValueOnce({
      response: { status: 409, data: { code: "STOCK_INSUFICIENTE" } },
    });
    await expect(chatbotApi.listarCarrito("conv-1")).rejects.toBeTruthy();
  });

  it("agregar envía solo los campos definidos y devuelve el carrito", async () => {
    peticiones.post.mockResolvedValueOnce({ data: { mensaje: "Agregué", carrito: CARRITO } });
    const out = await chatbotApi.agregarAlCarrito({ sku: "SKU-1", cantidad: 1 }, "conv-1");
    expect(peticiones.post).toHaveBeenCalledWith(
      "/carrito/items",
      { sku: "SKU-1", cantidad: 1 },
      expect.objectContaining({ params: { conversacionId: "conv-1" } })
    );
    expect(out.ok).toBe(true);
    expect(out.carrito?.subtotal).toBe(200);
  });

  it("agregar incluye product_id/talla/color cuando la tarjeta los conoce", async () => {
    peticiones.post.mockResolvedValueOnce({ data: { carrito: CARRITO } });
    await chatbotApi.agregarAlCarrito(
      { sku: "SKU-1", cantidad: 1, product_id: "p1", talla: "42", color: "negro" },
      "conv-1"
    );
    expect(peticiones.post).toHaveBeenCalledWith(
      "/carrito/items",
      { sku: "SKU-1", cantidad: 1, product_id: "p1", talla: "42", color: "negro" },
      expect.anything()
    );
  });
});
