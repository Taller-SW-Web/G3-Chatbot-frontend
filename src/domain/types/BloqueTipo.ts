/**
 * Tipos de bloque que manda el backend (contratos §2.1, SPEC-05 motor-conversacion).
 * La UI mapea Bloque.tipo → components/blocks/*.tsx
 */
export const BloqueTipo = {
  TEXTO: "TEXTO",
  CARRUSEL_PRODUCTOS: "CARRUSEL_PRODUCTOS",
  DETALLE_PRODUCTO: "DETALLE_PRODUCTO",
  SELECTOR_VARIANTE: "SELECTOR_VARIANTE",
  CARRITO: "CARRITO",
  ACCIONES_RAPIDAS: "ACCIONES_RAPIDAS",
  FORMULARIO: "FORMULARIO",
  RESUMEN_CHECKOUT: "RESUMEN_CHECKOUT",
  CONFIRMACION_PEDIDO: "CONFIRMACION_PEDIDO",
  LISTA_PEDIDOS: "LISTA_PEDIDOS",
  ESTADO_PEDIDO: "ESTADO_PEDIDO",
  LISTA_PROMOCIONES: "LISTA_PROMOCIONES",
  CONSTANCIA_RECLAMO: "CONSTANCIA_RECLAMO",
  ESTADO_RECLAMO: "ESTADO_RECLAMO",
  /** TODO: not in contratos-integracion.md §2.1 yet; confirm with the team. */
  LISTA_RECLAMOS: "LISTA_RECLAMOS",
  CONSTANCIA_DEVOLUCION: "CONSTANCIA_DEVOLUCION",
  ESTADO_DEVOLUCION: "ESTADO_DEVOLUCION",
  /** TODO: not in contratos-integracion.md §2.1 yet; confirm with the team. */
  LISTA_DEVOLUCIONES: "LISTA_DEVOLUCIONES",
  ERROR: "ERROR",
} as const;

export type BloqueTipo = (typeof BloqueTipo)[keyof typeof BloqueTipo];
