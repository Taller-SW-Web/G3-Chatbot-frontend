import type { ChatApiPort } from "@/modules/mod-chat/ports/chatApiPort";

/** GET .../mensajes: últimos mensajes de la conversación (sin paginación ni `desde`). */
export async function cargarHistorialUseCase(api: ChatApiPort, conversacionId: string) {
  return api.cargarHistorial(conversacionId);
}
