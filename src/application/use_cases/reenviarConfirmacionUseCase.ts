import type { ChatbotApiPort, ReenvioConfirmacion } from "@/ports/outbound/ChatbotApiPort";

/** Reenvía el correo de confirmación del pedido (SPEC-16 Req. 3, máx. 2 por pedido).
 *
 * Una `Idempotency-Key` nueva por clic: repetir la misma clave devolvería la
 * misma respuesta sin reenviar (contratos-integracion §2.5.2).
 */
export async function reenviarConfirmacionUseCase(
  api: ChatbotApiPort,
  input: { pedidoId: string; idempotencyKey?: string }
): Promise<ReenvioConfirmacion> {
  const pedidoId = input.pedidoId.trim();
  if (!pedidoId) throw new Error("pedidoId requerido");
  return api.reenviarConfirmacion(pedidoId, input.idempotencyKey ?? crypto.randomUUID());
}
