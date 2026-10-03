import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

/** GET /chat/conversaciones orden ultimo_mensaje_en. SPEC-05 Req.1 */
export async function listarConversacionesUseCase(api: ChatbotApiPort) {
  return api.listarConversaciones();
}
