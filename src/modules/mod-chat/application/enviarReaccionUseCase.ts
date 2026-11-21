/** Reacción a un mensaje (SPEC-24 Req. 1). Sin React y sin red. */

import type {
  ChatApiPort,
  ReaccionMensaje,
} from "@/modules/mod-chat/ports/chatApiPort";

const REACCIONES: ReaccionMensaje[] = ["POSITIVE", "NEGATIVE"];

/**
 * Registra la reacción y, si falla, la reintenta una sola vez en segundo plano.
 * Nunca lanza: el ícono ya quedó marcado de forma optimista y el chat no se bloquea.
 */
export async function enviarReaccionUseCase(
  api: ChatApiPort,
  mensajeId: string,
  reaccion: ReaccionMensaje
): Promise<void> {
  if (!mensajeId || !REACCIONES.includes(reaccion)) return;
  try {
    await api.enviarReaccion(mensajeId, reaccion);
  } catch {
    try {
      await api.enviarReaccion(mensajeId, reaccion);
    } catch {
      // Silencio por diseño: es un límite anti-abuso, no un error de negocio.
    }
  }
}
