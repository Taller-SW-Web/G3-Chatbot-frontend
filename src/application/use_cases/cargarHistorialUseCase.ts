import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

/** GET .../mensajes paginado + ?desde= polling cada 2s. */
export async function cargarHistorialUseCase(
  api: ChatbotApiPort,
  input: { conversacionId: string; desde?: string }
) {
  return api.cargarHistorial(input.conversacionId, input.desde);
}
