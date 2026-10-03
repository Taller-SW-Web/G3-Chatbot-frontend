import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

/** POST texto/acción → 202 mensajeId, streaming por WS. SPEC-05 Req.4 */
export async function enviarMensajeUseCase(
  api: ChatbotApiPort,
  input: { conversacionId: string; texto: string }
) {
  if (!input.texto.trim()) throw new Error("Mensaje vacío");
  return api.enviarMensaje(input.conversacionId, input.texto.trim());
}
