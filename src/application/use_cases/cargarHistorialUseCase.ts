import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

/** GET .../mensajes: últimos mensajes de la conversación (sin paginación ni `desde`). */
export async function cargarHistorialUseCase(api: ChatbotApiPort, conversacionId: string) {
  return api.cargarHistorial(conversacionId);
}
