import type { ChatbotApiPort, ResultadoCupon } from "@/ports/outbound/ChatbotApiPort";

/** Quita el cupón del carrito y recalcula los totales (SPEC-13). */
export async function quitarCuponUseCase(api: ChatbotApiPort): Promise<ResultadoCupon> {
  return api.quitarCupon();
}
