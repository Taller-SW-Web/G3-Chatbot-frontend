"use client";

import { http } from "@/shared/api/http";
import { apiConfig } from "@/shared/config/apiConfig";
import type {
  CotizacionEnvio,
  CotizarEnvioInput,
  EnvioPort,
} from "@/modules/mod-shipping/ports/envioPort";

// Cotización de envío con Despacho (SPEC-12): el costo y el plazo los decide
// el backend; la UI nunca inventa un envío. Requiere sesión de cliente.
export const envioApi: EnvioPort = {
  async cotizarEnvio(input: CotizarEnvioInput): Promise<CotizacionEnvio> {
    const { data } = await http.post(`/envio/cotizar`, input, {
      timeout: apiConfig.timeouts.catalogo,
    });
    return data as CotizacionEnvio;
  },
};
