import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chatbotSse } from "@/adapters/outbound/ChatbotSseAdapter";
import { useChatStore } from "@/application/state/chatStore";
import {
  ChatStreamError,
  type ChatStreamEvento,
} from "@/ports/outbound/ChatStreamPort";

const encoder = new TextEncoder();

function frame(nombre: string, data: unknown): string {
  return `event: ${nombre}\ndata: ${typeof data === "string" ? data : JSON.stringify(data)}\n\n`;
}

function streamDe(chunks: Array<string | Uint8Array>): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(typeof c === "string" ? encoder.encode(c) : c);
      controller.close();
    },
  });
}

function respuestaSse(chunks: Array<string | Uint8Array>): Response {
  return new Response(streamDe(chunks), {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

function problema(status: number, body: unknown): Response {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });
}

const fetchMock = vi.fn();

async function enviar(signal?: AbortSignal) {
  const eventos: ChatStreamEvento[] = [];
  await chatbotSse.enviarMensajeStream("c-1", "hola", (e) => eventos.push(e), signal);
  return eventos;
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  useChatStore.setState({ accessToken: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("chatbotSse.enviarMensajeStream", () => {
  it("emite aceptado, token, bloque y fin en orden", async () => {
    const bloque = { tipo: "texto", texto: "Listo" };
    fetchMock.mockResolvedValue(
      respuestaSse([
        frame("aceptado", { mensajeId: "m-1" }),
        frame("token", { texto: "Ho" }),
        frame("token", { texto: "la" }),
        frame("bloque", { bloque }),
        frame("fin", { mensajeId: "m-2" }),
      ])
    );

    expect(await enviar()).toEqual([
      { tipo: "aceptado", mensajeId: "m-1" },
      { tipo: "token", texto: "Ho" },
      { tipo: "token", texto: "la" },
      { tipo: "bloque", bloque },
      { tipo: "fin", mensajeId: "m-2" },
    ]);
  });

  it("decodifica un carácter multibyte partido entre chunks", async () => {
    const bytes = encoder.encode(frame("token", { texto: "👕ñ" }));
    const corte = bytes.indexOf(0xf0) + 2; // dentro del emoji de 4 bytes
    fetchMock.mockResolvedValue(respuestaSse([bytes.slice(0, corte), bytes.slice(corte)]));

    expect(await enviar()).toEqual([{ tipo: "token", texto: "👕ñ" }]);
  });

  it("emite degradado con su motivo", async () => {
    fetchMock.mockResolvedValue(
      respuestaSse([
        frame("token", { texto: "parcial" }),
        frame("degradado", { motivo: "LLM_NO_DISPONIBLE" }),
        frame("fin", { mensajeId: "m-2" }),
      ])
    );

    expect(await enviar()).toEqual([
      { tipo: "token", texto: "parcial" },
      { tipo: "degradado", motivo: "LLM_NO_DISPONIBLE" },
      { tipo: "fin", mensajeId: "m-2" },
    ]);
  });

  it("emite el evento error con su code y deja de leer", async () => {
    fetchMock.mockResolvedValue(
      respuestaSse([
        frame("error", { code: "ERROR_INTERNO" }),
        frame("token", { texto: "ignorado" }),
      ])
    );

    expect(await enviar()).toEqual([{ tipo: "error", code: "ERROR_INTERNO" }]);
  });

  it("resuelve sin inventar fin cuando el stream termina antes", async () => {
    fetchMock.mockResolvedValue(respuestaSse([frame("token", { texto: "a" })]));

    expect(await enviar()).toEqual([{ tipo: "token", texto: "a" }]);
  });

  it("no emite un frame final sin línea en blanco", async () => {
    fetchMock.mockResolvedValue(respuestaSse(['event: fin\ndata: {"mensajeId":"m"}']));

    expect(await enviar()).toEqual([]);
  });

  it("ignora eventos desconocidos", async () => {
    fetchMock.mockResolvedValue(
      respuestaSse([
        frame("futuro", { x: 1 }),
        frame("token", { texto: "a" }),
        ": keep-alive\n\n",
      ])
    );

    expect(await enviar()).toEqual([{ tipo: "token", texto: "a" }]);
  });

  it("mapea JSON malformado de un evento conocido a STREAM_INVALIDO", async () => {
    fetchMock.mockResolvedValue(
      respuestaSse([frame("token", "{no es json"), frame("fin", { mensajeId: "m" })])
    );

    expect(await enviar()).toEqual([{ tipo: "error", code: "STREAM_INVALIDO" }]);
  });

  it("mapea un payload sin los campos esperados a STREAM_INVALIDO", async () => {
    fetchMock.mockResolvedValue(respuestaSse([frame("token", { otro: 1 })]));

    expect(await enviar()).toEqual([{ tipo: "error", code: "STREAM_INVALIDO" }]);
  });

  it("envía la petición con URL, método, cabeceras, credenciales y cuerpo esperados", async () => {
    fetchMock.mockResolvedValue(respuestaSse([]));
    const controller = new AbortController();

    await enviar(controller.signal);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/chat/conversaciones/c-1/mensajes");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    });
    expect(init.credentials).toBe("include");
    expect(init.body).toBe(JSON.stringify({ texto: "hola" }));
    expect(init.signal).toBe(controller.signal);
  });

  it("codifica el identificador de la conversación en la URL", async () => {
    fetchMock.mockResolvedValue(respuestaSse([]));

    await chatbotSse.enviarMensajeStream("a/b c", "hola", () => {});

    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/chat/conversaciones/a%2Fb%20c/mensajes");
  });

  it("agrega Authorization solo cuando hay token en el store", async () => {
    fetchMock.mockResolvedValue(respuestaSse([]));
    useChatStore.setState({ accessToken: "jwt-123" });

    await enviar();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ Authorization: "Bearer jwt-123" });
  });

  it("rechaza con ChatStreamError ante problem+json 400", async () => {
    fetchMock.mockResolvedValue(
      problema(400, { status: 400, code: "VALIDACION", title: "Invalid request", detail: "vacío" })
    );

    const error = await enviar().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ChatStreamError);
    expect(error).toMatchObject({ status: 400, code: "VALIDACION", detail: "vacío" });
  });

  it("rechaza con ChatStreamError ante problem+json 404", async () => {
    fetchMock.mockResolvedValue(
      problema(404, { status: 404, code: "RECURSO_NO_ENCONTRADO", title: "Resource not found" })
    );

    const error = await enviar().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ChatStreamError);
    expect(error).toMatchObject({ status: 404, code: "RECURSO_NO_ENCONTRADO" });
    expect((error as ChatStreamError).detail).toBeUndefined();
  });

  it("rechaza con código genérico cuando el cuerpo de error no es JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Bad Gateway</html>", { status: 502 }));

    const error = await enviar().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ChatStreamError);
    expect(error).toMatchObject({ status: 502, code: "ERROR_DESCONOCIDO" });
  });

  it("al abortar a mitad del stream rechaza con AbortError y libera el lock", async () => {
    const controller = new AbortController();
    const flujo: ReadableStream<Uint8Array> = new ReadableStream({
      start(c) {
        c.enqueue(encoder.encode(frame("token", { texto: "a" })));
        controller.signal.addEventListener("abort", () =>
          c.error(new DOMException("Aborted", "AbortError"))
        );
      },
    });
    fetchMock.mockResolvedValue(new Response(flujo, { status: 200 }));

    const eventos: ChatStreamEvento[] = [];
    const promesa = chatbotSse.enviarMensajeStream(
      "c-1",
      "hola",
      (e) => {
        eventos.push(e);
        controller.abort();
      },
      controller.signal
    );

    await expect(promesa).rejects.toMatchObject({ name: "AbortError" });
    expect(eventos).toEqual([{ tipo: "token", texto: "a" }]);
    expect(flujo.locked).toBe(false);
  });

  it("propaga el AbortError de fetch si se aborta antes de la respuesta", async () => {
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));

    await expect(enviar()).rejects.toMatchObject({ name: "AbortError" });
  });

  it("libera el lock al terminar el stream", async () => {
    const flujo = streamDe([frame("fin", { mensajeId: "m" })]);
    fetchMock.mockResolvedValue(new Response(flujo, { status: 200 }));

    await enviar();

    expect(flujo.locked).toBe(false);
  });
});
