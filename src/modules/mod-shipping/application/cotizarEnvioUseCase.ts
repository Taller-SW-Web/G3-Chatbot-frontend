import type { CotizacionEnvio, CotizarEnvioInput, EnvioPort } from "@/modules/mod-shipping/ports/envioPort";

/** Cotiza el envío del carrito contra Despacho (SPEC-12 Req. 2 y 4). Sin mocks. */
export async function cotizarEnvioUseCase(
  api: EnvioPort,
  input: CotizarEnvioInput
): Promise<CotizacionEnvio> {
  return api.cotizarEnvio(input);
}
