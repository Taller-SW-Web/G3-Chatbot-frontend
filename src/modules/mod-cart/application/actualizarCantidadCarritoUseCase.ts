import type { CarritoBackend, CarritoPort } from "@/modules/mod-cart/ports/carritoPort";

/** Cambia la cantidad de una línea; 0 la elimina (SPEC-11 Req. 2). Valida stock en backend. */
export async function actualizarCantidadCarritoUseCase(
  api: CarritoPort,
  input: { itemId: string; cantidad: number; conversacionId?: string }
): Promise<CarritoBackend> {
  const itemId = input.itemId.trim();
  if (!itemId) throw new Error("itemId requerido");
  if (!Number.isInteger(input.cantidad) || input.cantidad < 0 || input.cantidad > 10)
    throw new Error("Cantidad 0-10");
  return api.actualizarCantidadCarrito(itemId, input.cantidad, input.conversacionId);
}
