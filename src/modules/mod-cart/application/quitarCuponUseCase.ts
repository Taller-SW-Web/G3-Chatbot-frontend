import type { CarritoPort, ResultadoCupon } from "@/modules/mod-cart/ports/carritoPort";

/** Quita el cupón del carrito y recalcula los totales (SPEC-13). */
export async function quitarCuponUseCase(api: CarritoPort): Promise<ResultadoCupon> {
  return api.quitarCupon();
}
