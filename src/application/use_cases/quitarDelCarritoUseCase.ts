import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

/** Quita una línea del carrito (SPEC-11 Req. 2). */
export async function quitarDelCarritoUseCase(
  api: ChatbotApiPort,
  input: { itemId: string; conversacionId?: string }
): Promise<{ mensaje: string }> {
  const itemId = input.itemId.trim();
  if (!itemId) throw new Error("itemId requerido");
  return api.eliminarLineaCarrito(itemId, input.conversacionId);
}
