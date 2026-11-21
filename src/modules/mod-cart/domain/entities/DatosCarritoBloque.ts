/**
 * Datos del bloque CARRITO que envía el backend (SPEC-11).
 * Viven en mod-cart para que el bloque de carrito no dependa de mod-chat;
 * mod-chat los reexporta desde `domain/entities/Bloque`.
 */
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
