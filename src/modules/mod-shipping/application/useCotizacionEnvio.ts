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

/** Línea del carrito que cuenta para el envío: Despacho cotiza por `sku` y `cantidad`. */
export type LineaCotizable = { sku: string; cantidad: number };

/**
 * Firma estable del contenido del carrito: no depende del orden de las líneas ni
 * de precios o cupones, solo de lo que cambia el paquete que envía Despacho.
 */
export function firmaCarritoEnvio(lineas: readonly LineaCotizable[]): string {
  return lineas
    .map((l) => `${l.sku}:${l.cantidad}`)
    .sort()
    .join("|");
}

/**
 * Clave de caché por dirección y contenido del carrito: cambiar de distrito o
 * de productos recotiza (SPEC-12 Req. 4 y 5).
 */
export function cotizacionEnvioQueryKey(
  direccion: DireccionCotizable | null,
  firmaCarrito: string | null = null,
) {
  return [
    "cotizacion-envio",
    direccion?.distrito ?? null,
    direccion?.direccion ?? null,
    direccion?.nombre ?? null,
    firmaCarrito,
  ] as const;
}

/**
 * Cotización del envío (SPEC-12): el costo y el plazo los decide Despacho a
 * través del backend (`POST /envio/cotizar`), que toma las líneas del carrito
 * del servidor. La UI nunca inventa un envío.
 *
 * `lineasCarrito` es el contenido vigente del carrito: mientras no se conoce
 * (`undefined`) no se cotiza, y cuando cambia la clave cambia y se recotiza.
 */
export function useCotizacionEnvio(
  direccion: DireccionCotizable | null,
  lineasCarrito: readonly LineaCotizable[] | undefined,
) {
  const firmaCarrito = lineasCarrito ? firmaCarritoEnvio(lineasCarrito) : null;
  const habilitado = Boolean(direccion?.distrito) && firmaCarrito !== null;
  const query = useQuery({
    queryKey: cotizacionEnvioQueryKey(direccion, firmaCarrito),
    queryFn: async () => {
      if (!direccion) throw new Error("dirección requerida");
      return cotizarEnvioUseCase(container.envio, {
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
