import type { CarritoBackend, ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

/** Lee el carrito con totales recalculados (SPEC-11 Req. 3). Sin mocks. */
export async function listarCarritoUseCase(
  api: ChatbotApiPort,
  conversacionId?: string
): Promise<CarritoBackend> {
  return api.listarCarrito(conversacionId);
}
