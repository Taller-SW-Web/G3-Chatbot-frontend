import { apiConfig } from "@/infrastructure/config/apiConfig";
import { useChatStore } from "@/application/state/chatStore";
import type { Bloque } from "@/domain/entities/Bloque";
import {
  ChatStreamError,
  type ChatStreamEvento,
  type ChatStreamPort,
} from "@/ports/outbound/ChatStreamPort";
import { crearSseParser, type SseFrame } from "./sseParser";

/** Código del evento `error` sintético cuando un frame conocido trae JSON inválido. */
export const CODE_STREAM_INVALIDO = "STREAM_INVALIDO";

const CODE_DESCONOCIDO = "ERROR_DESCONOCIDO";

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Convierte un frame crudo en evento tipado.
 * - Nombre desconocido: `null` (se ignora, para tolerar eventos futuros).
 * - JSON malformado o campos faltantes en un evento conocido: evento `error`
 *   con `STREAM_INVALIDO`, de modo que la UI cierre el turno en vez de quedar
 *   esperando un `fin` que no llegará.
 */
function mapearFrame(frame: SseFrame): ChatStreamEvento | null {
  const invalido: ChatStreamEvento = { tipo: "error", code: CODE_STREAM_INVALIDO };
  switch (frame.event) {
    case "aceptado":
    case "token":
    case "bloque":
    case "degradado":
    case "fin":
    case "error":
      break;
    default:
      return null;
  }
  let payload: unknown;
  try {
    payload = JSON.parse(frame.data);
  } catch {
    return invalido;
  }
  if (!esObjeto(payload)) return invalido;

  switch (frame.event) {
    case "aceptado":
      return typeof payload.mensajeId === "string"
        ? { tipo: "aceptado", mensajeId: payload.mensajeId }
        : invalido;
    case "fin":
      return typeof payload.mensajeId === "string"
        ? { tipo: "fin", mensajeId: payload.mensajeId }
        : invalido;
    case "token":
      return typeof payload.texto === "string"
        ? { tipo: "token", texto: payload.texto }
        : invalido;
    case "bloque":
      return esObjeto(payload.bloque)
        ? { tipo: "bloque", bloque: payload.bloque as unknown as Bloque }
        : invalido;
    case "degradado":
      return { tipo: "degradado", motivo: typeof payload.motivo === "string" ? payload.motivo : "" };
    default:
      return typeof payload.code === "string"
        ? { tipo: "error", code: payload.code }
        : invalido;
  }
}

/** Lee el problem+json de una respuesta no 2xx; tolera cuerpos que no son JSON. */
async function leerError(response: Response): Promise<ChatStreamError> {
  let code = CODE_DESCONOCIDO;
  let detail: string | undefined;
  try {
    const body: unknown = JSON.parse(await response.text());
    if (esObjeto(body)) {
      if (typeof body.code === "string") code = body.code;
      if (typeof body.detail === "string") detail = body.detail;
    }
  } catch {
    // Cuerpo vacío o no JSON: se conservan el estado y el código genérico.
  }
  return new ChatStreamError(response.status, code, detail);
}

/**
 * Adaptador SSE con `fetch` (ADR-0021). `EventSource` no sirve: el turno es un
 * POST con cuerpo. Si el stream termina sin `fin` ni `error` no se inventa
 * ninguno: se resuelve y el llamador decide cómo tratar el turno incompleto.
 */
export const chatbotSse: ChatStreamPort = {
  async enviarMensajeStream(conversacionId, texto, onEvento, signal) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    };
    // Mismo origen del token que el interceptor JWT del adaptador REST.
    const token = useChatStore.getState().accessToken;
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(
      `${apiConfig.baseUrl}/chat/conversaciones/${encodeURIComponent(conversacionId)}/mensajes`,
      {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ texto }),
        signal,
      }
    );

    if (!response.ok) throw await leerError(response);
    if (!response.body) {
      throw new ChatStreamError(response.status, CODE_STREAM_INVALIDO, "Respuesta sin cuerpo");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    const parser = crearSseParser();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          // Vacía bytes retenidos por el decodificador; un frame sin línea en blanco final no se emite.
          parser.push(decoder.decode());
          return;
        }
        for (const frame of parser.push(decoder.decode(value, { stream: true }))) {
          const evento = mapearFrame(frame);
          if (!evento) continue;
          onEvento(evento);
          // Tras un `error` el backend cierra el stream; no se sigue leyendo.
          if (evento.tipo === "error") {
            await reader.cancel().catch(() => undefined);
            return;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};
