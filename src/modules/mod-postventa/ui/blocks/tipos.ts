/**
 * Contrato de `datos` de los bloques de postventa (SPEC-20, SPEC-22; delta M5).
 * `respuestaVisibleCliente` y `resolucion.fundamento` se muestran tal como los
 * devuelve Ventas: el frontend no los resume ni los reformula.
 */

/** Fila de `LISTA_RECLAMOS` y base de `ESTADO_RECLAMO`/`CONSTANCIA_RECLAMO`. */
export type ReclamoBloqueResumen = {
  codigoSeguimiento: string;
  fecha: string;
  pedidoId?: string | null;
  tipo: string;
  motivo: string;
  estado: string;
  estadoEtiqueta: string;
  fechaLimiteSLA?: string | null;
};

/** `ESTADO_RECLAMO.datos`: resumen más la respuesta textual de Ventas. */
export type EstadoReclamoDatos = ReclamoBloqueResumen & {
  respuestaVisibleCliente?: string | null;
};

/** `CONSTANCIA_RECLAMO.datos`: la constancia que produce `CONFIRMAR_RECLAMO`. */
export type ConstanciaReclamoDatos = ReclamoBloqueResumen & {
  mensaje: string;
};

/** Fila de `LISTA_DEVOLUCIONES` y base de `ESTADO_DEVOLUCION`/`CONSTANCIA_DEVOLUCION`. */
export type DevolucionBloqueResumen = {
  devolucionId: string;
  pedidoId: string;
  fecha: string;
  tipo: string;
  motivo: string;
  estado: string;
  estadoEtiqueta: string;
  estadoReembolso?: string | null;
};

/** Reembolso ya ejecutado o programado por Ventas. */
export type ReembolsoBloque = {
  reembolsoId?: string;
  estado?: string;
  /** Ventas puede serializar el decimal como número o cadena; se muestra sin recalcular. */
  monto?: number | string;
  moneda?: string;
  fechaEjecucion?: string;
};

/** Resolución del caso; ninguno de sus campos se inventa si falta. */
export type ResolucionDevolucion = {
  fundamento?: string;
  reembolso?: ReembolsoBloque;
};

/** `ESTADO_DEVOLUCION.datos`. */
export type EstadoDevolucionDatos = DevolucionBloqueResumen & {
  resolucion?: ResolucionDevolucion | null;
};

/** `CONSTANCIA_DEVOLUCION.datos`. */
export type ConstanciaDevolucionDatos = DevolucionBloqueResumen;
