import type { CarritoPort } from "@/modules/mod-cart/ports/carritoPort";

/** Vacía el carrito tras confirmación explícita en la UI (SPEC-05 Req. 6, SPEC-11). */
export async function vaciarCarritoUseCase(
  api: CarritoPort,
  conversacionId?: string
): Promise<{ mensaje: string }> {
  return api.vaciarCarrito(conversacionId);
}
