import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

/** GET /buscar?q= título+mensajes. */
export async function buscarConversacionesUseCase(
  api: ChatbotApiPort,
  q: string
) {
  return api.buscarConversaciones(q);
}
