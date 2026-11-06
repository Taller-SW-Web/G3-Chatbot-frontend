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
import { cotizarEnvioUseCase } from "@/application/use_cases/cotizarEnvioUseCase";
import { mensajeCotizacion } from "@/application/errors/cotizacionMensajes";
import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

const DIRECCION = {
  destinatario: "Ana Díaz",
  direccion: "Av. Larco 1234, dpto. 502",
  distrito: "Miraflores",
  referencia: "Frente al parque",
};

const COTIZACION = {
  coberturaDisponible: true,
  costoEnvio: 12.5,
  moneda: "PEN",
  plazoEstimadoDias: 1,
  fechaEstimadaEntrega: "2026-11-07",
  nombreZona: "Lima Metropolitana",
  modalidad: "DELIVERY",
  distrito: "Miraflores",
};

function errorHttp(data: unknown, status = 422) {
  return { response: { status, data } };
}

describe("cotización de envío (SPEC-12)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    peticiones.post.mockResolvedValue({ data: COTIZACION });
  });

  it("el adapter llama a POST /envio/cotizar con los campos del checkout", async () => {
    const resultado = await chatbotApi.cotizarEnvio(DIRECCION);

    expect(peticiones.post).toHaveBeenCalledTimes(1);
    const [url, cuerpo, opciones] = peticiones.post.mock.calls[0];
    expect(url).toBe("/envio/cotizar");
    expect(cuerpo).toEqual(DIRECCION);
    expect(opciones).toMatchObject({ timeout: expect.any(Number) });
    expect(resultado.costoEnvio).toBe(12.5);
    expect(resultado.plazoEstimadoDias).toBe(1);
    expect(resultado.distrito).toBe("Miraflores");
  });

  it("el caso de uso delega en el puerto sin tocar los datos", async () => {
    const api = {
      cotizarEnvio: vi.fn().mockResolvedValue(COTIZACION),
    } as unknown as ChatbotApiPort;

    const resultado = await cotizarEnvioUseCase(api, DIRECCION);

    expect(api.cotizarEnvio).toHaveBeenCalledWith(DIRECCION);
    expect(resultado).toBe(COTIZACION);
  });

  it("traduce los errores del backend a mensajes humanos", () => {
    expect(mensajeCotizacion(errorHttp({ code: "SIN_COBERTURA" }))).toContain("distrito");
    expect(mensajeCotizacion(errorHttp({ code: "REQUIERE_SESION" }, 401))).toContain("Inicia sesión");
    expect(mensajeCotizacion(errorHttp({ code: "DEMASIADAS_SOLICITUDES" }, 429))).toContain("Espera");
    expect(mensajeCotizacion(errorHttp({ code: "PRODUCTO_NO_DISPONIBLE" }, 409))).toContain("carrito");
    expect(mensajeCotizacion({ request: {} })).toContain("No pudimos");
  });
});
