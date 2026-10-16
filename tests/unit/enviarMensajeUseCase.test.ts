import { describe, it, expect, vi } from "vitest";
import {
  enviarMensajeUseCase,
  MENSAJE_MAX_CARACTERES,
} from "@/application/use_cases/enviarMensajeUseCase";
import type { ChatStreamEvento, ChatStreamPort } from "@/ports/outbound/ChatStreamPort";

function streamFalso(eventos: ChatStreamEvento[] = []) {
  const enviarMensajeStream = vi.fn<ChatStreamPort["enviarMensajeStream"]>(
    async (_id, _texto, onEvento) => {
      for (const e of eventos) onEvento(e);
    }
  );
  return { stream: { enviarMensajeStream } as ChatStreamPort, enviarMensajeStream };
}

describe("enviarMensajeUseCase", () => {
  it.each(["", "   ", "\n\t"])("rechaza texto vacío %j sin llamar al stream", async (texto) => {
    const { stream, enviarMensajeStream } = streamFalso();
    await expect(enviarMensajeUseCase(stream, "c-1", texto, vi.fn())).rejects.toThrow(
      "Mensaje vacío"
    );
    expect(enviarMensajeStream).not.toHaveBeenCalled();
  });

  it("rechaza más de 1000 caracteres sin llamar al stream", async () => {
    const { stream, enviarMensajeStream } = streamFalso();
    const largo = "a".repeat(MENSAJE_MAX_CARACTERES + 1);
    await expect(enviarMensajeUseCase(stream, "c-1", largo, vi.fn())).rejects.toThrow(
      /demasiado largo/
    );
    expect(enviarMensajeStream).not.toHaveBeenCalled();
  });

  it("acepta exactamente 1000 caracteres", async () => {
    const { stream, enviarMensajeStream } = streamFalso();
    await enviarMensajeUseCase(stream, "c-1", "a".repeat(MENSAJE_MAX_CARACTERES), vi.fn());
    expect(enviarMensajeStream).toHaveBeenCalledOnce();
  });

  it("recorta el texto y reenvía onEvento y signal", async () => {
    const { stream, enviarMensajeStream } = streamFalso();
    const onEvento = vi.fn();
    const signal = new AbortController().signal;
    await enviarMensajeUseCase(stream, "c-1", "  hola  ", onEvento, signal);
    expect(enviarMensajeStream).toHaveBeenCalledWith("c-1", "hola", onEvento, signal);
  });

  it("entrega los eventos del stream a onEvento en orden", async () => {
    const eventos: ChatStreamEvento[] = [
      { tipo: "aceptado", mensajeId: "m-1" },
      { tipo: "token", texto: "ho" },
      { tipo: "token", texto: "la" },
      { tipo: "fin", mensajeId: "m-2" },
    ];
    const { stream } = streamFalso(eventos);
    const recibidos: ChatStreamEvento[] = [];
    await enviarMensajeUseCase(stream, "c-1", "hola", (e) => recibidos.push(e));
    expect(recibidos).toEqual(eventos);
  });

  it("propaga el rechazo del stream", async () => {
    const falla = new Error("sin red");
    const stream: ChatStreamPort = { enviarMensajeStream: vi.fn().mockRejectedValue(falla) };
    await expect(enviarMensajeUseCase(stream, "c-1", "hola", vi.fn())).rejects.toBe(falla);
  });
});
