import type {
  AccionChat,
  ChatApiPort,
} from "@/modules/mod-chat/ports/chatApiPort";

/** Ejecuta una acción rápida en REST, fuera del flujo de texto y streaming. */
export async function ejecutarAccionChatUseCase(
  api: ChatApiPort,
  input: { conversacionId: string; accion: AccionChat }
) {
  if (!input.conversacionId.trim()) throw new Error("Conversación inválida");
  if (!input.accion.tipo.trim()) throw new Error("Acción inválida");
  return api.ejecutarAccion(input.conversacionId, input.accion);
}
