import type { AgregarAlCarritoInput, ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

/** {sku,cantidad} valida stock 409/503. `product_id`/`talla`/`color` completan la línea. SPEC-10,11 */
export async function agregarProductoAlCarritoUseCase(
  api: ChatbotApiPort,
  input: AgregarAlCarritoInput & { conversacionId?: string }
) {
  if (!input.sku.trim()) throw new Error("sku requerido");
  if (input.cantidad < 1 || input.cantidad > 10)
    throw new Error("Cantidad 1-10");
  return api.agregarAlCarrito(
    {
      sku: input.sku,
      cantidad: input.cantidad,
      product_id: input.product_id,
      talla: input.talla,
      color: input.color,
    },
    input.conversacionId
  );
}
