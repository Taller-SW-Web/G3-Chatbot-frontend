import { beforeEach, describe, expect, it, vi } from "vitest";

const { postMock, requestUseMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  requestUseMock: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: { request: { use: requestUseMock } },
      post: postMock,
      get: vi.fn(),
    })),
  },
}));

import { chatbotApi } from "@/adapters/outbound/ChatbotApiAxiosAdapter";
import { ejecutarAccionChatUseCase } from "@/application/use_cases/ejecutarAccionChatUseCase";
import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

describe("acciones rápidas de chat", () => {
  beforeEach(() => postMock.mockReset());

  it("el caso de uso delega la acción al puerto", async () => {
    const accion = { tipo: "VER_CARRITO", payload: { origen: "chat" } };
    const resultado = { texto: "Tu carrito está vacío.", bloques: [] };
    const api = {
      ejecutarAccion: vi.fn().mockResolvedValue(resultado),
    } as unknown as ChatbotApiPort;

    await expect(
      ejecutarAccionChatUseCase(api, { conversacionId: "conv-1", accion })
    ).resolves.toEqual(resultado);
    expect(api.ejecutarAccion).toHaveBeenCalledWith("conv-1", accion);
  });

  it("rechaza una conversación o acción vacía antes de llamar al puerto", async () => {
    const api = { ejecutarAccion: vi.fn() } as unknown as ChatbotApiPort;

    await expect(
      ejecutarAccionChatUseCase(api, {
        conversacionId: " ",
        accion: { tipo: "VER_CARRITO", payload: {} },
      })
    ).rejects.toThrow("Conversación inválida");
    await expect(
      ejecutarAccionChatUseCase(api, {
        conversacionId: "conv-1",
        accion: { tipo: " ", payload: {} },
      })
    ).rejects.toThrow("Acción inválida");
    expect(api.ejecutarAccion).not.toHaveBeenCalled();
  });

  it("hace POST con {accion:{tipo,payload}} y devuelve texto/bloques", async () => {
    const resultado = { texto: "Carrito", bloques: [{ id: "b1", tipo: "CARRITO" }] };
    postMock.mockResolvedValue({ data: resultado });

    await expect(
      chatbotApi.ejecutarAccion("conv/1", {
        tipo: "VER_CARRITO",
        payload: { origen: "chat" },
      })
    ).resolves.toEqual(resultado);

    expect(postMock).toHaveBeenCalledWith(
      "/chat/conversaciones/conv%2F1/mensajes",
      { accion: { tipo: "VER_CARRITO", payload: { origen: "chat" } } }
    );
  });

  it("propaga errores de red sin convertirlos en una respuesta exitosa mock", async () => {
    postMock.mockRejectedValueOnce(new Error("network unavailable"));

    await expect(
      chatbotApi.ejecutarAccion("conv-1", { tipo: "VER_CARRITO", payload: {} })
    ).rejects.toThrow("network unavailable");
  });
});
