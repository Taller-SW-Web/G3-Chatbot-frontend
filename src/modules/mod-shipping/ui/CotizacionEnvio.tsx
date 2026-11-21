"use client";

import { mensajeCotizacion } from "../application/errors/cotizacionMensajes";
import type { CotizacionEnvio as CotizacionEnvioData } from "../ports/envioPort";

/**
 * Bloque de cotización de envío de `/checkout` (SPEC-12).
 * El costo y el plazo vienen del backend; sin cotización no se puede confirmar.
 */
export function CotizacionEnvio({
  cotizacion,
  cotizando,
  error,
  onReintentar,
}: {
  cotizacion: CotizacionEnvioData | null;
  cotizando: boolean;
  error: unknown;
  onReintentar: () => void;
}) {
  const texto = cotizando
    ? "Calculando envío…"
    : cotizacion
      ? `Envío a ${cotizacion.distrito}: S/ ${cotizacion.costoEnvio.toFixed(2)} · ${cotizacion.plazoEstimadoDias} día(s) hábil(es)`
      : error
        ? mensajeCotizacion(error)
        : "Envío: se calcula al elegir la dirección";

  return (
    <>
      <p
        className={`text-[12px] ${error ? "text-error-default" : "text-text-secondary"}`}
        role={error ? "alert" : undefined}
      >
        {texto}
      </p>
      {error && (
        <button
          type="button"
          onClick={onReintentar}
          className="wf-chip w-fit px-3 py-1.5 text-[12px] font-semibold text-text-primary"
        >
          Reintentar cotización
        </button>
      )}
    </>
  );
}
