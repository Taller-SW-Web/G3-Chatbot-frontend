import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

/** {sku,cantidad} valida stock 409/503. SPEC-10,11 */
export async function agregarProductoAlCarritoUseCase(
  api: ChatbotApiPort,
  input: { sku: string; cantidad: number; conversacionId?: string }
) {
  if (!input.sku.trim()) throw new Error("sku requerido");
  if (input.cantidad < 1 || input.cantidad > 10)
    throw new Error("Cantidad 1-10");
  return api.agregarAlCarrito(
    { sku: input.sku, cantidad: input.cantidad },
    input.conversacionId
  );
}
