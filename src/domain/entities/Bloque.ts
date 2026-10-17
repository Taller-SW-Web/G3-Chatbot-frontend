/** Entidad Bloque (SPEC-05 motor-conversacion Req. 4).
 *
 * Unidad visual que manda el backend por SSE (eventos aceptado/token/bloque/degradado/fin/error).
 * Sin React, sin fetch (regla hexagonal domain/).
 */
import type { BloqueTipo } from "../types/BloqueTipo";
import type { BackendCarouselItem, BackendProductDetail } from "./CatalogoUI";

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
  datos: { productos: BackendCarouselItem[] };
};

export type BloqueDetalle = BloqueBase & {
  tipo: "DETALLE_PRODUCTO";
  datos: { producto: BackendProductDetail };
};

/** Missing attributes the backend asks for before it can add a variant to the cart. */
export type BloqueSelectorVariante = BloqueBase & {
  tipo: "SELECTOR_VARIANTE";
  datos: { product_id: string; faltantes: string[] };
};

/** Form request; the backend sends only the form kind, no data. */
export type BloqueFormulario = BloqueBase & {
  tipo: "FORMULARIO";
  formulario: string;
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

export type LineaCarritoBloque = {
  item_id: string;
  sku?: string;
  nombre: string;
  variante?: string | null;
  cantidad: number;
  precio: number;
  disponible: boolean;
  imagen?: string | null;
  nota?: string | null;
};

export type DatosCarritoBloque = {
  lineas: LineaCarritoBloque[];
  subtotal: number;
  descuentos?: { nombre: string; monto: number }[];
  costoEnvio?: number | null;
  envio?: string | null;
  total?: number;
  avisos?: string[];
  promociones_ok?: boolean;
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
  pedidoId: string;
  correoEnmascarado: string;
  total: number;
};

export type BloqueError = BloqueBase & {
  tipo: "ERROR";
  /** problem+json code: the UI branches by code, never by text. */
  code: string;
  mensaje: string;
  disponible?: number;
};

/** Unión de bloques. Los 19 tipos del enum caen aquí; los no listados usan payload genérico. */
export type Bloque =
  | BloqueTexto
  | BloqueCarrusel
  | BloqueDetalle
  | BloqueSelectorVariante
  | BloqueFormulario
  | BloqueAcciones
  | BloqueCarritoResumen
  | BloqueResumenCheckout
  | BloqueConfirmacion
  | BloqueError
  | (BloqueBase & { payload?: unknown });
