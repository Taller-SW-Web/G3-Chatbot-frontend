/** Producto para UI (catálogo / carrusel / detalle). */
export type ProductoUI = {
  sku: string;
  nombre: string;
  categoria: string;
  talla: string;
  color: string;
  precio: number;
  stock: number;
  imagen?: string;
};
