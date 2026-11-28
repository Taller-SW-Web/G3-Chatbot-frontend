import type { OrdenCatalogo } from "@/modules/mod-catalog/domain/entities/OrdenCatalogo";

/** Filtros de `GET /catalogo/productos` (SPEC-06, nombres reales del contrato). */
export type BuscarProductosInput = {
  soloOfertas?: boolean;
  q?: string;
  categoria?: string;
  marca?: string;
  precioMin?: number;
  precioMax?: number;
  orden?: OrdenCatalogo;
  pagina?: number;
  tamanio?: number;
};

/** Página de catálogo (`items`, `total`; el mensaje trae aclaraciones). */
export type PaginaCatalogo = {
  items: unknown[];
  total: number;
  mensaje?: string;
  partial?: boolean;
  total_scope?: string;
};

/** Disponibilidad puntual (`GET /catalogo/disponibilidad`, SPEC-10). */
export type DisponibilidadPuntual = {
  sku: string;
  status: string;
  veredicto?: string | null;
};

/** Contrato REST de catálogo (SPEC-06, SPEC-09, SPEC-10). Sin mocks. */
export interface CatalogoPort {
  buscarProductos(input: BuscarProductosInput): Promise<PaginaCatalogo>;
  verDetalleProducto(productId: string): Promise<unknown>;
  consultarDisponibilidad(sku: string, cantidad?: number): Promise<DisponibilidadPuntual[]>;
  /** `GET /catalogo/promociones` → `items` sin validar (los filtra `parsePromotions`). */
  listarPromociones(): Promise<unknown>;
}
