"use client";

import { useQuery } from "@tanstack/react-query";
import { container } from "@/shared/di/container";
import { cotizarEnvioUseCase } from "@/modules/mod-shipping/application/cotizarEnvioUseCase";

/** Datos mínimos de la dirección que necesita Despacho (evita depender de mod-checkout). */
export type DireccionCotizable = {
  nombre: string;
  direccion: string;
  distrito: string;
  referencia?: string;
};

/** Clave de caché por dirección: cambiar de distrito recotiza (SPEC-12 Req. 4). */
export function cotizacionEnvioQueryKey(direccion: DireccionCotizable | null) {
  return [
    "cotizacion-envio",
    direccion?.distrito ?? null,
    direccion?.direccion ?? null,
    direccion?.nombre ?? null,
  ] as const;
}

/**
 * Cotización del envío (SPEC-12): el costo y el plazo los decide Despacho a
 * través del backend (`POST /envio/cotizar`). La UI nunca inventa un envío.
 */
export function useCotizacionEnvio(direccion: DireccionCotizable | null) {
  const habilitado = Boolean(direccion?.distrito);
  const query = useQuery({
    queryKey: cotizacionEnvioQueryKey(direccion),
    queryFn: async () => {
      if (!direccion) throw new Error("dirección requerida");
      return cotizarEnvioUseCase(container.api, {
        destinatario: direccion.nombre,
        direccion: direccion.direccion,
        distrito: direccion.distrito,
        referencia: direccion.referencia || undefined,
      });
    },
    enabled: habilitado,
    retry: false,
    staleTime: 60_000,
  });

  return {
    cotizacion: query.data ?? null,
    cotizando: habilitado && query.isFetching,
    error: query.error,
    reintentar: () => void query.refetch(),
  };
}
