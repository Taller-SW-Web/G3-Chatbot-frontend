import type { ChatStreamEvento, ChatStreamPort } from "@/ports/outbound/ChatStreamPort";

/** Largo máximo del mensaje que acepta el backend (1 a 1000 caracteres). */
export const MENSAJE_MAX_CARACTERES = 1000;

/** Recorta y valida el texto; lanza si está vacío o excede el máximo. */
export function validarMensaje(texto: string): string {
  const limpio = texto.trim();
  if (!limpio) throw new Error("Mensaje vacío");
  if (limpio.length > MENSAJE_MAX_CARACTERES) {
    throw new Error(`Mensaje demasiado largo (máximo ${MENSAJE_MAX_CARACTERES} caracteres)`);
  }
  return limpio;
}

/** POST del mensaje y turno del asistente por SSE. SPEC-05 Req.4 */
export async function enviarMensajeUseCase(
  stream: ChatStreamPort,
  conversacionId: string,
  texto: string,
  onEvento: (e: ChatStreamEvento) => void,
  signal?: AbortSignal
): Promise<void> {
  const limpio = validarMensaje(texto);
  return stream.enviarMensajeStream(conversacionId, limpio, onEvento, signal);
}
