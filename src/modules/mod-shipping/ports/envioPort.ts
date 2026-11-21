/** Entrada de `POST /envio/cotizar` (SPEC-12 Req. 2 y 4). */
export type CotizarEnvioInput = {
  destinatario: string;
  direccion: string;
  distrito: string;
  referencia?: string;
};

/** Respuesta de `POST /envio/cotizar`: cobertura, costo y plazo reales. */
export type CotizacionEnvio = {
  coberturaDisponible: boolean;
  costoEnvio: number;
  moneda: string;
  plazoEstimadoDias: number;
  fechaEstimadaEntrega?: string | null;
  nombreZona?: string | null;
  modalidad?: string;
  distrito: string;
};

/** Contrato REST de envío (SPEC-12). Requiere sesión de cliente. */
export interface EnvioPort {
  cotizarEnvio(input: CotizarEnvioInput): Promise<CotizacionEnvio>;
}
