/** Adapter de pedidos: detalle y listado contra el contrato del BFF (SPEC-17). */
import { beforeEach, describe, expect, it, vi } from "vitest";

const peticiones = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: peticiones.get,
      interceptors: {
        request: { use: () => {} },
        response: { use: () => {} },
      },
    }),
    isAxiosError: (e: unknown) => Boolean((e as { response?: unknown } | null)?.response),
  },
}));

import { pedidosApi } from "@/modules/mod-orders/adapters/pedidosApi";

beforeEach(() => {
  peticiones.get.mockReset();
});

describe("pedidosApi", () => {
  it("obtiene el detalle con el id codificado", async () => {
    peticiones.get.mockResolvedValueOnce({ data: { pedidoId: "PED/1" } });

    const detalle = await pedidosApi.obtenerPedido("PED/1");

    expect(peticiones.get).toHaveBeenCalledWith("/pedidos/PED%2F1", { timeout: 60000 });
    expect(detalle).toEqual({ pedidoId: "PED/1" });
  });

  it("usa el timeout de 60 s al listar pedidos", async () => {
    peticiones.get.mockResolvedValueOnce({ data: { items: [], total: 0, page: 1, pageSize: 20 } });

    await pedidosApi.listarPedidos({ page: 1, pageSize: 20 });

    expect(peticiones.get).toHaveBeenCalledWith("/pedidos", {
      params: { page: 1, pageSize: 20 },
      timeout: 60000,
    });
  });
});
