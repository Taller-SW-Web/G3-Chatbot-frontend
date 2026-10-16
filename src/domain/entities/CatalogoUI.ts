/** Catálogo con datos de las herramientas (SPEC-06 Req. 1, SPEC-09 Req. 1, 3).
 *
 * Formas que emite el backend (`CARRUSEL_PRODUCTOS`, `DETALLE_PRODUCTO`):
 * identificadores `product_id`, precio e imagen del módulo, disponibilidad
 * por estado (sin cantidades). El precio nunca se calcula en el frontend.
 * Sin React, sin fetch (regla hexagonal domain/).
 */

export type AvailabilityState =
  | "DISPONIBLE"
  | "POCAS_UNIDADES"
  | "AGOTADO"
  | "INDETERMINADO";

/** Fila de `CARRUSEL_PRODUCTOS` tal como llega en `bloque.datos.productos`. */
export type BackendCarouselItem = {
  ref?: number;
  product_id: string;
  name?: string;
  brand?: string | null;
  image?: string | null;
  price?: number;
  price_text?: string;
  short_description?: string | null;
  has_variants?: boolean;
  single_sku?: string | null;
  availability?: string;
  talla?: string;
  color?: string;
};

/** Detalle tal como llega en `DETALLE_PRODUCTO`. */
export type BackendProductDetail = {
  product_id: string;
  name?: string;
  brand?: string | null;
  description?: string | null;
  images?: string[];
  price?: number;
  price_text?: string;
  has_variants?: boolean;
  availability?: string;
  variants?: { sku: string; talla?: string | null; color?: string | null }[];
};

/** Tarjeta que pintan `ProductCard` y `CarruselProductos`. */
export type CatalogCardItem = {
  ref?: number;
  product_id: string;
  /** Solo productos sin variantes (agregado directo). */
  sku?: string;
  name: string;
  brand?: string | null;
  price: number;
  image?: string | null;
  shortDescription?: string;
  hasVariants: boolean;
  availability: AvailabilityState;
  /** Solo semillas mock en el chat hasta que el bucle las reemplace. */
  talla?: string;
  color?: string;
};

const KNOWN_STATES: AvailabilityState[] = [
  "DISPONIBLE",
  "POCAS_UNIDADES",
  "AGOTADO",
  "INDETERMINADO",
];

export function toAvailabilityState(value: unknown): AvailabilityState {
  return KNOWN_STATES.includes(value as AvailabilityState)
    ? (value as AvailabilityState)
    : "INDETERMINADO";
}

function toPrice(value: unknown): number {
  const amount = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

export function mapCarouselItem(item: BackendCarouselItem, ref: number): CatalogCardItem {
  return {
    ref: item.ref ?? ref,
    product_id: item.product_id,
    sku: item.single_sku ?? undefined,
    name: item.name ?? item.product_id,
    brand: item.brand ?? null,
    price: toPrice(item.price),
    image: item.image ?? undefined,
    shortDescription: item.short_description ?? undefined,
    hasVariants: item.has_variants ?? false,
    availability: toAvailabilityState(item.availability),
    talla: item.talla,
    color: item.color,
  };
}

/** Detalle con variantes reales y descripción con fallback (SPEC-09). */
export type CatalogDetail = {
  product_id: string;
  name: string;
  brand?: string | null;
  description: string;
  images: string[];
  price: number;
  hasVariants: boolean;
  availability: AvailabilityState;
  variants: { sku: string; talla?: string | null; color?: string | null }[];
  tallas: string[];
  colores: string[];
};

export function mapProductDetail(data: BackendProductDetail): CatalogDetail {
  const name = data.name ?? data.product_id;
  const variants = data.variants ?? [];
  const tallas = [...new Set(variants.map((v) => v.talla).filter(Boolean))] as string[];
  const colores = [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[];
  return {
    product_id: data.product_id,
    name,
    brand: data.brand ?? null,
    description: data.description ?? `${name}. Calzado verificado.`,
    images: data.images ?? [],
    price: toPrice(data.price),
    hasVariants: data.has_variants ?? variants.length > 0,
    availability: toAvailabilityState(data.availability),
    variants,
    tallas,
    colores,
  };
}

/** Variante exacta para talla+color, o null si hay que preguntar. */
export function findVariantSku(
  detail: CatalogDetail,
  talla: string | null,
  color: string | null
): string | null {
  const match = detail.variants.find(
    (v) =>
      (talla == null || v.talla === talla) &&
      (color == null || v.color === color)
  );
  const complete =
    match != null &&
    (detail.tallas.length === 0 || talla != null) &&
    (detail.colores.length === 0 || color != null);
  return complete && match?.sku ? match.sku : null;
}
