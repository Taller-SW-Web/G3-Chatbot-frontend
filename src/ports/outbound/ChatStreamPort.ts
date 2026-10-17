import type { Bloque } from "@/domain/entities/Bloque";

/**
 * Eventos del turno del asistente por SSE (ADR-0021, contratos §SSE).
 * Los nombres de campo reflejan el encoder del backend (`sse.py`).
 */
export type ChatStreamEvento =
  /** Mensaje del cliente persistido. */
  | { tipo: "aceptado"; mensajeId: string }
  /** Fragmento de texto de la respuesta. */
  | { tipo: "token"; texto: string }
  /** Bloque estructurado listo para renderizar. */
  | { tipo: "bloque"; bloque: Bloque }
  /** El cliente descarta los tokens recibidos hasta ahora. */
  | { tipo: "degradado"; motivo: string }
  /** Mensaje del asistente completado; siempre el último de un turno exitoso. */
  | { tipo: "fin"; mensajeId: string }
  /** Fallo inesperado a mitad del stream; el stream termina justo después. */
  | { tipo: "error"; code: string };

/**
 * Error previo al stream: el backend respondió con un estado no 2xx
 * (`application/problem+json`: 400 VALIDACION, 404 RECURSO_NO_ENCONTRADO, 501...).
 */
export class ChatStreamError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail?: string;

  constructor(status: number, code: string, detail?: string) {
    super(detail ?? code);
    this.name = "ChatStreamError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

export interface ChatStreamPort {
  /**
   * Envía el mensaje y entrega cada evento del turno a `onEvento` en orden.
   * Resuelve cuando el stream termina; rechaza con `ChatStreamError` ante una
   * respuesta no 2xx y con el `AbortError` original si `signal` aborta.
   */
  enviarMensajeStream(
    conversacionId: string,
    texto: string,
    onEvento: (evento: ChatStreamEvento) => void,
    signal?: AbortSignal
  ): Promise<void>;
}
