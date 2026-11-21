import { describe, it, expect, vi } from "vitest";
import { cargarHistorialUseCase } from "@/modules/mod-chat/application/cargarHistorialUseCase";
import type { ChatApiPort } from "@/modules/mod-chat/ports/chatApiPort";

describe("cargarHistorialUseCase", () => {
  it("delega en el puerto con el id de la conversación", async () => {
    const mensajes = [
      { id: "m-1", conversacionId: "c-1", rol: "user" as const, texto: "hola", creadoEn: "x" },
    ];
    const cargarHistorial = vi.fn().mockResolvedValue(mensajes);
    const api = { cargarHistorial } as unknown as ChatApiPort;
    await expect(cargarHistorialUseCase(api, "c-1")).resolves.toBe(mensajes);
    expect(cargarHistorial).toHaveBeenCalledWith("c-1");
  });
});
