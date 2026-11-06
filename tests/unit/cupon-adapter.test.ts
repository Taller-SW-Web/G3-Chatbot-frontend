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
import { aplicarCuponUseCase } from "@/application/use_cases/aplicarCuponUseCase";
import { quitarCuponUseCase } from "@/application/use_cases/quitarCuponUseCase";
import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

const RESULTADO = {
  mensaje: "Cupón SPORT10 aplicado.",
  cupon: { codigo: "SPORT10", descuento: 10, moneda: "PEN", promocionId: "promo-10" },
  carrito: {
    lineas: [],
    subtotal: 100,
    descuentos: [{ nombre: "Cupón SPORT10", monto: 10 }],
    costoEnvio: null,
    total: 90,
    avisos: [],
  },
};

describe("cupones: contrato del adapter (SPEC-13)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    peticiones.post.mockResolvedValue({ data: RESULTADO });
    peticiones.delete.mockResolvedValue({ data: RESULTADO });
  });

  it("aplicar envía el código normalizado y la confirmación de reemplazo", async () => {
    const resultado = await chatbotApi.aplicarCupon("SPORT10", true);

    expect(peticiones.post).toHaveBeenCalledTimes(1);
    const [url, cuerpo, opciones] = peticiones.post.mock.calls[0];
    expect(url).toBe("/carrito/cupon");
    expect(cuerpo).toEqual({ codigo: "SPORT10", confirmarReemplazo: true });
    expect(opciones).toMatchObject({ timeout: expect.any(Number) });
    expect(resultado.carrito.total).toBe(90);
    expect(resultado.cupon?.codigo).toBe("SPORT10");
  });

  it("aplicar sin reemplazo explícito manda confirmarReemplazo en false", async () => {
    await chatbotApi.aplicarCupon("SPORT10");

    expect(peticiones.post.mock.calls[0][1]).toEqual({
      codigo: "SPORT10",
      confirmarReemplazo: false,
    });
  });

  it("quitar llama a DELETE /carrito/cupon sin cuerpo", async () => {
    const resultado = await chatbotApi.quitarCupon();

    expect(peticiones.delete).toHaveBeenCalledTimes(1);
    expect(peticiones.delete.mock.calls[0][0]).toBe("/carrito/cupon");
    expect(resultado.cupon).toEqual(RESULTADO.cupon);
  });

  it("los casos de uso delegan en el puerto", async () => {
    const api = {
      aplicarCupon: vi.fn().mockResolvedValue(RESULTADO),
      quitarCupon: vi.fn().mockResolvedValue(RESULTADO),
    } as unknown as ChatbotApiPort;

    await aplicarCuponUseCase(api, "SPORT10", true);
    await quitarCuponUseCase(api);

    expect(api.aplicarCupon).toHaveBeenCalledWith("SPORT10", true);
    expect(api.quitarCupon).toHaveBeenCalled();
  });
});
