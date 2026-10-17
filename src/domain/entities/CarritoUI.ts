import type { ProductoUI } from "./ProductoUI";

export type LineaCarrito = {
  producto: ProductoUI;
  cantidad: number;
};

/** Carrito UI. El stock y los totales los decide el backend (409/503). */
export type CarritoUI = {
  lineas: LineaCarrito[];
  subtotal: number;
  count: number;
};

/** Total de UI: el subtotal ya viene calculado del backend (sin descuentos inventados). */
export function totalesCarrito(c: Pick<CarritoUI, "subtotal">): {
  total: number;
} {
  return { total: c.subtotal };
}
