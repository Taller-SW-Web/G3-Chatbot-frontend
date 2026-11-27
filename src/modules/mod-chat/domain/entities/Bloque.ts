/** Entidad Bloque (SPEC-05 motor-conversacion Req. 4).
 *
 * Unidad visual que manda el backend por SSE (eventos aceptado/token/bloque/degradado/fin/error).
 * Sin React, sin fetch (regla hexagonal domain/).
 */
import type { BloqueTipo } from "@/modules/mod-chat/domain/types/BloqueTipo";
import type { PromotionSummary } from "@/modules/mod-catalog/public";
import type { BackendCarouselItem, BackendProductDetail } from "@/modules/mod-catalog/public";
import type { DatosCarritoBloque, LineaCarritoBloque } from "@/modules/mod-cart/public";
import type {
  HitoPedido,
  PedidoBloqueDetalle,
  PedidoBloqueResumen,
  SeguimientoBloque,
} from "@/modules/mod-orders/public";
import type {
  ConstanciaDevolucionDatos,
  ConstanciaReclamoDatos,
  DevolucionBloqueResumen,
  EstadoDevolucionDatos,
  EstadoReclamoDatos,
  ReclamoBloqueResumen,
} from "@/modules/mod-postventa/public";

export type { DatosCarritoBloque, LineaCarritoBloque };

/** Base de todo bloque visual que manda el backend. */
export type BloqueBase = {
  id: string;
  tipo: BloqueTipo;
};

export type BloqueTexto = BloqueBase & {
  tipo: "TEXTO";
  texto: string;
};

/** Backend wraps catalog payloads in `datos`; there is no top-level `titulo`. */
export type BloqueCarrusel = BloqueBase & {
  tipo: "CARRUSEL_PRODUCTOS";
  datos: { productos: BackendCarouselItem[]; variant?: "recomendacion" | "cross_sell" | "ofertas"; titulo?: string; partial?: boolean };
};

export type PromotionsBlock = BloqueBase & {
  tipo: "LISTA_PROMOCIONES";
  datos: { promociones: PromotionSummary[]; unavailable?: boolean };
};

export type BloqueDetalle = BloqueBase & {
  tipo: "DETALLE_PRODUCTO";
  datos: { producto: BackendProductDetail };
};

/** Missing attributes the backend asks for before it can add a variant to the cart. */
export type BloqueSelectorVariante = BloqueBase & {
  tipo: "SELECTOR_VARIANTE";
  datos: { product_id: string; faltantes: string[]; seleccion?: Record<string, string> };
};

/** Form request; the backend sends the form kind and, for OTP, the masked phone. */
export type BloqueFormulario = BloqueBase & {
  tipo: "FORMULARIO";
  formulario: string;
  celularEnmascarado?: string;
  /** Prefill for FORMULARIO/RECLAMO and FORMULARIO/DEVOLUCION. */
  datos?: Record<string, unknown>;
};

export type BloqueAcciones = BloqueBase & {
  tipo: "ACCIONES_RAPIDAS";
  pregunta?: string;
  acciones: {
    id: string;
    etiqueta: string;
    payload?: Record<string, unknown>;
  }[];
};

export type BloqueCarritoResumen = BloqueBase & {
  tipo: "CARRITO";
  datos: DatosCarritoBloque;
};

export type BloqueResumenCheckout = BloqueBase & {
  tipo: "RESUMEN_CHECKOUT";
  total: number;
  direccion: string;
  tarjetaEnmascarada: string;
};

export type BloqueConfirmacion = BloqueBase & {
  tipo: "CONFIRMACION_PEDIDO";
  pedidoId?: string;
  correoEnmascarado?: string;
  total?: number;
  estado?: string;
  nuevoEstado?: string;
  motivo?: string;
  reembolso?: string;
  datos?: {
    pedidoId?: string;
    correoEnmascarado?: string;
    total?: number;
    estado?: string;
    nuevoEstado?: string;
    motivo?: string;
    reembolso?: string;
  };
};

export type BloqueError = BloqueBase & {
  tipo: "ERROR";
  /** problem+json code: the UI branches by code, never by text. */
  code: string;
  mensaje: string;
  disponible?: number;
};

/** LISTA_PEDIDOS: varios pedidos para elegir (SPEC-17 · delta M5). */
export type BloqueListaPedidos = BloqueBase & {
  tipo: "LISTA_PEDIDOS";
  datos: {
    pedidos: PedidoBloqueResumen[];
    mensaje?: string;
  };
};

/** ESTADO_PEDIDO: pedido, hitos de Ventas y seguimiento opcional de Despacho (SPEC-17, 18). */
export type BloqueEstadoPedido = BloqueBase & {
  tipo: "ESTADO_PEDIDO";
  datos: {
    pedido: PedidoBloqueDetalle;
    hitos: HitoPedido[];
    seguimiento?: SeguimientoBloque;
  };
};

/** LISTA_RECLAMOS: varios reclamos para elegir (SPEC-20 · delta M5). */
export type BloqueListaReclamos = BloqueBase & {
  tipo: "LISTA_RECLAMOS";
  datos: { reclamos: ReclamoBloqueResumen[] };
};

/** ESTADO_RECLAMO: detalle con la respuesta visible de Ventas (SPEC-20). */
export type BloqueEstadoReclamo = BloqueBase & {
  tipo: "ESTADO_RECLAMO";
  datos: EstadoReclamoDatos;
};

/** CONSTANCIA_RECLAMO: la produce la acción CONFIRMAR_RECLAMO (SPEC-19, 20). */
export type BloqueConstanciaReclamo = BloqueBase & {
  tipo: "CONSTANCIA_RECLAMO";
  datos: ConstanciaReclamoDatos;
};

/** LISTA_DEVOLUCIONES: solicitudes para elegir (SPEC-22 · delta M5). */
export type BloqueListaDevoluciones = BloqueBase & {
  tipo: "LISTA_DEVOLUCIONES";
  datos: { devoluciones: DevolucionBloqueResumen[] };
};

/** ESTADO_DEVOLUCION: detalle con resolución y reembolso opcionales (SPEC-22). */
export type BloqueEstadoDevolucion = BloqueBase & {
  tipo: "ESTADO_DEVOLUCION";
  datos: EstadoDevolucionDatos;
};

/** CONSTANCIA_DEVOLUCION: la produce la acción CONFIRMAR_DEVOLUCION (SPEC-21, 22). */
export type BloqueConstanciaDevolucion = BloqueBase & {
  tipo: "CONSTANCIA_DEVOLUCION";
  datos: ConstanciaDevolucionDatos;
};

/** Unión de bloques. Los 19 tipos del enum caen aquí; los no listados usan payload genérico. */
export type Bloque =
  | BloqueTexto
  | PromotionsBlock
  | BloqueCarrusel
  | BloqueDetalle
  | BloqueSelectorVariante
  | BloqueFormulario
  | BloqueAcciones
  | BloqueCarritoResumen
  | BloqueResumenCheckout
  | BloqueConfirmacion
  | BloqueError
  | BloqueListaPedidos
  | BloqueEstadoPedido
  | BloqueListaReclamos
  | BloqueEstadoReclamo
  | BloqueConstanciaReclamo
  | BloqueListaDevoluciones
  | BloqueEstadoDevolucion
  | BloqueConstanciaDevolucion
  | (BloqueBase & { payload?: unknown });
