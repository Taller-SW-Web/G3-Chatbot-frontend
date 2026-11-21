import type { ChatStreamEvento, ChatStreamPort } from "@/modules/mod-chat/ports/chatStreamPort";

/** Largo máximo del mensaje que acepta el backend (1 a 1000 caracteres). */
export const MENSAJE_MAX_CARACTERES = 1000;

/**
 * Recorta y valida el texto; lanza si está vacío o excede el máximo.
 * SPEC-23: el texto es opcional cuando el mensaje trae al menos un adjunto.
 */
export function validarMensaje(texto: string, permiteVacio = false): string {
  const limpio = texto.trim();
  if (!limpio && !permiteVacio) throw new Error("Mensaje vacío");
  if (limpio.length > MENSAJE_MAX_CARACTERES) {
    throw new Error(`Mensaje demasiado largo (máximo ${MENSAJE_MAX_CARACTERES} caracteres)`);
  }
  return limpio;
}

/** POST del mensaje y turno del asistente por SSE. SPEC-05 Req.4, SPEC-23 Req.4 */
export async function enviarMensajeUseCase(
  stream: ChatStreamPort,
  conversacionId: string,
  texto: string,
  onEvento: (e: ChatStreamEvento) => void,
  signal?: AbortSignal,
  adjuntoIds?: string[]
): Promise<void> {
  const limpio = validarMensaje(texto, Boolean(adjuntoIds && adjuntoIds.length > 0));
  if (adjuntoIds && adjuntoIds.length > 0) {
    return stream.enviarMensajeStream(conversacionId, limpio, onEvento, signal, adjuntoIds);
  }
  return stream.enviarMensajeStream(conversacionId, limpio, onEvento, signal);
}
