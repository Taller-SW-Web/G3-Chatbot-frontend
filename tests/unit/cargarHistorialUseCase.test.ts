import { describe, it, expect, vi } from "vitest";
import { cargarHistorialUseCase } from "@/application/use_cases/cargarHistorialUseCase";
import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

describe("cargarHistorialUseCase", () => {
  it("delega en el puerto con el id de la conversación", async () => {
    const mensajes = [
      { id: "m-1", conversacionId: "c-1", rol: "user" as const, texto: "hola", creadoEn: "x" },
    ];
    const cargarHistorial = vi.fn().mockResolvedValue(mensajes);
    const api = { cargarHistorial } as unknown as ChatbotApiPort;
    await expect(cargarHistorialUseCase(api, "c-1")).resolves.toBe(mensajes);
    expect(cargarHistorial).toHaveBeenCalledWith("c-1");
  });
});
