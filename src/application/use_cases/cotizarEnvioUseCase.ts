import type { CotizacionEnvio, CotizarEnvioInput, ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

/** Cotiza el envío del carrito contra Despacho (SPEC-12 Req. 2 y 4). Sin mocks. */
export async function cotizarEnvioUseCase(
  api: ChatbotApiPort,
  input: CotizarEnvioInput
): Promise<CotizacionEnvio> {
  return api.cotizarEnvio(input);
}
