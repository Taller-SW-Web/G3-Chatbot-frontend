import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

/** POST /chat/conversaciones: conversación vacía para "Nuevo chat". SPEC-05 Req.1 */
export async function crearConversacionUseCase(api: ChatbotApiPort) {
  return api.crearConversacion();
}
