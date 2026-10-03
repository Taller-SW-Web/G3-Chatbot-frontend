/** Entidad ProductoUI (H2-05 David, SPEC-09 tarjetas-detalle-producto Req. 1).
 *
 * Fuente: openspec/specs/tarjetas-detalle-producto (ProductoResumen).
 * El precio nunca se calcula en el frontend: viene de Productos.
 * Sin React, sin fetch (regla hexagonal domain/).
 */
export type DisponibilidadProducto = "DISPONIBLE" | "POCAS_UNIDADES" | "AGOTADO";

export interface ProductoUI {
  productoId: string;
  nombre: string;
  marca: string;
  imagenUrl: string;
  /** Precio ya calculado por el backend (nunca se opera aquí). */
  precioTexto: string;
  descripcionBreve: string;
  tieneVariantes: boolean;
  disponibilidad: DisponibilidadProducto;
  skuUnico?: string;
}
