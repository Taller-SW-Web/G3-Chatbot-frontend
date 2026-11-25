/**
 * Contrato de `datos` de los bloques de pedidos (SPEC-17, SPEC-18; delta M5).
 * El backend formatea `fecha` y `total`; el frontend no los recalcula ni los inventa.
 */

/** Fila de `LISTA_PEDIDOS` y cabecera de `ESTADO_PEDIDO`. */
export type PedidoBloqueResumen = {
  pedidoId: string;
  fecha: string;
  total: string;
  estado: string;
  estadoEtiqueta: string;
  canal: string;
};

/** Hito de la línea de tiempo de Ventas (`datos.hitos`). */
export type HitoPedido = {
  titulo: string;
  fecha: string;
  done: boolean;
};

/** Hito de la línea de tiempo de Despacho (`datos.seguimiento.hitos`). */
export type HitoSeguimiento = {
  titulo: string;
  fecha: string;
  completado: boolean;
};

/** Snapshot del envío dentro de `ESTADO_PEDIDO.datos.pedido`. */
export type EnvioBloque = {
  destinatario?: string | null;
  distrito?: string | null;
  direccion?: string | null;
  costo?: number | null;
  plazoEstimadoDias?: number | null;
};

/** Línea del pedido dentro de `ESTADO_PEDIDO.datos.pedido.items`. */
export type ItemPedidoBloque = {
  productoId?: string;
  sku?: string;
  descripcion?: string;
  cantidad?: number;
  precioUnitario?: number;
};

/** `ESTADO_PEDIDO.datos.pedido`: resumen más envío e items. */
export type PedidoBloqueDetalle = PedidoBloqueResumen & {
  envio?: EnvioBloque | null;
  items?: ItemPedidoBloque[];
};

/** `ESTADO_PEDIDO.datos.seguimiento` (SPEC-18). */
export type SeguimientoBloque = {
  estado: string;
  estadoEtiqueta: string;
  fechaProgramada?: string | null;
  distrito?: string | null;
  recibidoPor?: string | null;
  detalleDisponible: boolean;
  mensaje?: string | null;
  hitos: HitoSeguimiento[];
};
