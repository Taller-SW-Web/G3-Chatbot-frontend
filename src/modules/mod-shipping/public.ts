/**
 * Superficie pública de mod-shipping.
 * Otros módulos solo pueden importar desde aquí; nunca su domain/application/adapters.
 */
export { useCotizacionEnvio, cotizacionEnvioQueryKey, firmaCarritoEnvio } from "./application/useCotizacionEnvio";
export { CotizacionEnvio } from "./ui/CotizacionEnvio";
export type { DireccionCotizable, LineaCotizable } from "./application/useCotizacionEnvio";
export { cotizarEnvioUseCase } from "./application/cotizarEnvioUseCase";
export { mensajeCotizacion } from "./application/errors/cotizacionMensajes";
export type { CotizarEnvioInput, EnvioPort } from "./ports/envioPort";
