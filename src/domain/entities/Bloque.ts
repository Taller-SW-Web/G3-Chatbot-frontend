import type { BloqueTipo } from "../types/BloqueTipo";

/** Base de todo bloque visual que manda el backend. */
export type BloqueBase = {
  id: string;
  tipo: BloqueTipo;
};

export type BloqueTexto = BloqueBase & {
  tipo: "TEXTO";
  texto: string;
};

export type ProductoResumen = {
  sku: string;
  nombre: string;
  categoria: string;
  talla: string;
  color: string;
  precio: number;
  stock: number;
};

export type BloqueCarrusel = BloqueBase & {
  tipo: "CARRUSEL_PRODUCTOS";
  titulo: string;
  productos: ProductoResumen[];
};

export type BloqueDetalle = BloqueBase & {
  tipo: "DETALLE_PRODUCTO";
  producto: ProductoResumen & { descripcion: string };
};

export type BloqueAcciones = BloqueBase & {
  tipo: "ACCIONES_RAPIDAS";
  pregunta?: string;
  acciones: { id: string; etiqueta: string }[];
};

export type BloqueCarritoResumen = BloqueBase & {
  tipo: "CARRITO";
  lineas: { sku: string; nombre: string; cantidad: number; precio: number }[];
  subtotal: number;
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
  code: string;
  mensaje: string;
  disponible?: number;
};

/** Unión de bloques. Los 19 tipos del enum caen aquí; los no listados usan payload genérico. */
export type Bloque =
  | BloqueTexto
  | BloqueCarrusel
  | BloqueDetalle
  | BloqueAcciones
  | BloqueCarritoResumen
  | BloqueResumenCheckout
  | BloqueConfirmacion
  | BloqueError
  | (BloqueBase & { payload?: unknown });
