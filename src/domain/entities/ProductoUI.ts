/** Producto para UI (catálogo / carrusel / detalle).
 *
 * TODO: migrar al modelo ProductoResumen de SPEC-09 tarjetas-detalle-producto Req. 1
 * (productoId, marca, imagenUrl, precio desde backend, descripcionBreve,
 * tieneVariantes, disponibilidad, skuUnico). El precio nunca se calcula en el frontend.
 * Sin React, sin fetch (regla hexagonal domain/).
 */
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