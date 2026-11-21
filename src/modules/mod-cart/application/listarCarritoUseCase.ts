import type { CarritoBackend, CarritoPort } from "@/modules/mod-cart/ports/carritoPort";

/** Lee el carrito con totales recalculados (SPEC-11 Req. 3). Sin mocks. */
export async function listarCarritoUseCase(
  api: CarritoPort,
  conversacionId?: string
): Promise<CarritoBackend> {
  return api.listarCarrito(conversacionId);
}
