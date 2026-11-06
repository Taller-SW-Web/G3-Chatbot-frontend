/** Adapter del reenvío de confirmación contra el contrato del BFF (SPEC-16 Req. 3, §2.5.2). */
import { describe, it, expect, vi, beforeEach } from "vitest";

const peticiones = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: vi.fn(),
      post: peticiones.post,
      interceptors: {
        request: { use: () => {} },
        response: { use: () => {} },
      },
    }),
    isAxiosError: (e: unknown) => Boolean((e as { response?: unknown } | null)?.response),
  },
}));

import { chatbotApi } from "@/adapters/outbound/ChatbotApiAxiosAdapter";
import { reenviarConfirmacionUseCase } from "@/application/use_cases/reenviarConfirmacionUseCase";

const RESPUESTA = {
  ok: true,
  pedidoId: "PED-2026-00891",
  reenviosRestantes: 1,
  correoEnmascarado: "j***z@example.com",
};

beforeEach(() => peticiones.post.mockReset());

describe("reenviarConfirmacion", () => {
  it("llama a /reenviar-confirmacion con Idempotency-Key y devuelve el 202", async () => {
    peticiones.post.mockResolvedValueOnce({ status: 202, data: RESPUESTA });

    const r = await chatbotApi.reenviarConfirmacion("PED-2026-00891", "clave-1");

    expect(r).toEqual(RESPUESTA);
    expect(peticiones.post).toHaveBeenCalledWith(
      "/pedidos/PED-2026-00891/reenviar-confirmacion",
      null,
      { headers: { "Idempotency-Key": "clave-1" } }
    );
  });

  it("propaga el 429 en lugar de fingir un reenvío", async () => {
    const error = { response: { status: 429, data: { code: "LIMITE_REENVIOS_EXCEDIDO" } } };
    peticiones.post.mockRejectedValueOnce(error);

    await expect(chatbotApi.reenviarConfirmacion("PED-2026-00891", "clave-2")).rejects.toBe(error);
  });

  it("el caso de uso genera una clave nueva por llamada y valida el pedido", async () => {
    peticiones.post.mockResolvedValue({ status: 202, data: RESPUESTA });

    await reenviarConfirmacionUseCase(chatbotApi, { pedidoId: " PED-2026-00891 " });
    await reenviarConfirmacionUseCase(chatbotApi, { pedidoId: "PED-2026-00891" });

    const [a, b] = peticiones.post.mock.calls.map((c) => c[2].headers["Idempotency-Key"]);
    expect(a).not.toBe(b);
    expect(peticiones.post.mock.calls[0][0]).toBe("/pedidos/PED-2026-00891/reenviar-confirmacion");
    await expect(reenviarConfirmacionUseCase(chatbotApi, { pedidoId: " " })).rejects.toThrow("pedidoId");
  });
});
