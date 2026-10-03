import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

/** {sku,cantidad} valida stock 409/503. SPEC-10,11 */
export async function agregarProductoAlCarritoUseCase(
  api: ChatbotApiPort,
  input: { sku: string; cantidad: number }
) {
  if (input.cantidad < 1 || input.cantidad > 10)
    throw new Error("Cantidad 1-10");
  return api.agregarAlCarrito(input);
}
