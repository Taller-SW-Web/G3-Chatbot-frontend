import type { CarritoPort, ResultadoCupon } from "@/modules/mod-cart/ports/carritoPort";

/** Valida y aplica el cupón (SPEC-13). El uso se consume recién al confirmar el pedido. */
export async function aplicarCuponUseCase(
  api: CarritoPort,
  codigo: string,
  confirmarReemplazo = false
): Promise<ResultadoCupon> {
  return api.aplicarCupon(codigo, confirmarReemplazo);
}
