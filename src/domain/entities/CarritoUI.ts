import type { ProductoUI } from "./ProductoUI";

export type LineaCarrito = {
  producto: ProductoUI;
  cantidad: number;
};

/** Carrito UI. Stock se valida en backend (409/503). */
export type CarritoUI = {
  lineas: LineaCarrito[];
  subtotal: number;
  cupon?: string;
  /** Cupón aplicado: descuenta 20% (SPEC-13, paridad mockup). */
  cuponAplicado?: boolean;
  count: number;
};

/** Descuento del 20% si hay cupón aplicado + total. Cálculo puro de UI. */
export function totalesCarrito(c: Pick<CarritoUI, "subtotal" | "cuponAplicado">): {
  descuento: number;
  total: number;
} {
  const descuento = c.cuponAplicado ? c.subtotal * 0.2 : 0;
  return { descuento, total: c.subtotal - descuento };
}
