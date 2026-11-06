import type { ChatbotApiPort, ResultadoCupon } from "@/ports/outbound/ChatbotApiPort";

/** Valida y aplica el cupón (SPEC-13). El uso se consume recién al confirmar el pedido. */
export async function aplicarCuponUseCase(
  api: ChatbotApiPort,
  codigo: string,
  confirmarReemplazo = false
): Promise<ResultadoCupon> {
  return api.aplicarCupon(codigo, confirmarReemplazo);
}
