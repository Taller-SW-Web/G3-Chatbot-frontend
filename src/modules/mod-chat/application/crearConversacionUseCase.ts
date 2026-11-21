import type { ChatApiPort } from "@/modules/mod-chat/ports/chatApiPort";

/** POST /chat/conversaciones: conversación vacía para "Nuevo chat". SPEC-05 Req.1 */
export async function crearConversacionUseCase(api: ChatApiPort) {
  return api.crearConversacion();
}
