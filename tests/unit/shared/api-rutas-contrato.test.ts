import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * H3-13: el adaptador REST debe hablar exactamente el contrato `/api/v1`
 * (`docs/contratos-integracion.md` §2). Este archivo fija las rutas de la
 * tabla A para que un rename accidental vuelva a fallar en CI.
 */

const peticiones = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    create: () => ({
      ...peticiones,
      interceptors: { request: { use: () => {} }, response: { use: () => {} } },
    }),
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

import { container } from "@/shared/di/container";

const chatbotApi = container.api;
import { apiConfig } from "@/shared/config/apiConfig";

describe("contrato de rutas del frontend (/api/v1)", () => {
  beforeEach(() => {
    peticiones.get.mockReset().mockResolvedValue({ data: {} });
    peticiones.post.mockReset().mockResolvedValue({ data: {} });
    peticiones.patch.mockReset().mockResolvedValue({ data: {} });
    peticiones.delete.mockReset().mockResolvedValue({ data: {} });
  });

  it("agrega al carrito en POST /carrito/items", async () => {
    await chatbotApi.agregarAlCarrito({ sku: "SKU-1", cantidad: 2 });
    expect(peticiones.post).toHaveBeenCalledWith(
      "/carrito/items",
      { sku: "SKU-1", cantidad: 2 },
      expect.objectContaining({ timeout: apiConfig.timeouts.catalogo })
    );
  });

  it("verifica el OTP del celular en POST /contacto/celular/verificar-otp", async () => {
    peticiones.post.mockResolvedValueOnce({ data: { verificado: true } });
    await expect(chatbotApi.validarContactoCelular("123456")).resolves.toEqual({ verificado: true });
    expect(peticiones.post).toHaveBeenCalledWith("/contacto/celular/verificar-otp", { codigo: "123456" });
  });

  it("cotiza el envío en POST /envio/cotizar", async () => {
    const input = { destinatario: "Cliente", direccion: "Av. Siempre Viva 742", distrito: "Miraflores" };
    await chatbotApi.cotizarEnvio(input);
    expect(peticiones.post).toHaveBeenCalledWith(
      "/envio/cotizar",
      input,
      expect.objectContaining({ timeout: apiConfig.timeouts.catalogo })
    );
  });

  it("reenvía la confirmación en POST /pedidos/{id}/reenviar-confirmacion con Idempotency-Key", async () => {
    await chatbotApi.reenviarConfirmacion("pedido/1", "idem-1");
    expect(peticiones.post).toHaveBeenCalledWith(
      "/pedidos/pedido%2F1/reenviar-confirmacion",
      null,
      { headers: { "Idempotency-Key": "idem-1" } }
    );
  });

  it("crea el checkout en POST /checkout con Idempotency-Key", async () => {
    await chatbotApi.iniciarCheckout({ cartId: "cart-1" }, "idem-checkout");
    expect(peticiones.post).toHaveBeenCalledWith(
      "/checkout",
      { cartId: "cart-1" },
      { headers: { "Idempotency-Key": "idem-checkout" } }
    );
  });

  it("lista conversaciones paginadas y carga el historial por id", async () => {
    await chatbotApi.listarConversaciones(2);
    expect(peticiones.get).toHaveBeenNthCalledWith(1, "/chat/conversaciones", { params: { pagina: 2 } });

    peticiones.get.mockResolvedValueOnce({ data: [] });
    await chatbotApi.cargarHistorial("conv/1");
    expect(peticiones.get).toHaveBeenNthCalledWith(2, "/chat/conversaciones/conv%2F1/mensajes");
  });

  it("no conserva los métodos legacy con rutas fuera del contrato", () => {
    expect("cotizar" in chatbotApi).toBe(false);
    expect("crearCheckout" in chatbotApi).toBe(false);
  });
});
