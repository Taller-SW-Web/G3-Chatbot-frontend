import { parseAmount, parseIsoDate, type OfferPrice } from "./PromocionesUI";
/** Catálogo con datos de las herramientas (SPEC-06 Req. 1, SPEC-09 Req. 1, 3).
 *
 * Formas que emite el backend (`CARRUSEL_PRODUCTOS`, `DETALLE_PRODUCTO`):
 * identificadores `product_id`, precio e imagen del módulo, disponibilidad
 * por estado (sin cantidades). El detalle reutiliza el mismo resumen que el
 * carrusel (`image`, `short_description`, `variants`), no manda `description`
 * ni `images[]`. El precio nunca se calcula en el frontend.
 * Sin React, sin fetch (regla hexagonal domain/).
 */

export type AvailabilityState =
  | "DISPONIBLE"
  | "POCAS_UNIDADES"
  | "AGOTADO"
  | "INDETERMINADO";

/** Tono visual por estado; una sola fuente para card, carrusel y modal. */
export type AvailabilityTone = "ok" | "low" | "out" | "unknown";

const AVAILABILITY_META: Record<
  AvailabilityState,
  { label: string; tone: AvailabilityTone }
> = {
  DISPONIBLE: { label: "Disponible", tone: "ok" },
  POCAS_UNIDADES: { label: "¡Quedan pocas unidades!", tone: "low" },
  AGOTADO: { label: "Agotado", tone: "out" },
  INDETERMINADO: { label: "Disponibilidad no confirmada", tone: "unknown" },
};

/** Etiqueta y tono únicos por estado (INDETERMINADO nunca se pinta como disponible). */
export function availabilityMeta(state: AvailabilityState): {
  label: string;
  tone: AvailabilityTone;
} {
  return AVAILABILITY_META[state] ?? AVAILABILITY_META.INDETERMINADO;
}

/** Fila de `CARRUSEL_PRODUCTOS` tal como llega en `bloque.datos.productos`. */
export type BackendCarouselItem = {
  ref?: number;
  product_id: string;
  name?: string;
  brand?: string | null;
  image?: string | null;
  /** Decimal serialized by SSE as a string, or a plain number. */
  price?: number | string | null;
  regular_price?: number | string | null;
  offer_price?: number | string | null;
  savings_pct?: number | null;
  offer_valid_until?: string | null;
  recommendation_reason?: string | null;
  price_text?: string;
  short_description?: string | null;
  has_variants?: boolean;
  single_sku?: string | null;
  availability?: string;
  talla?: string;
  color?: string;
};

/** Detalle tal como llega en `DETALLE_PRODUCTO` (mismo resumen que el carrusel). */
export type BackendProductDetail = {
  ref?: number;
  product_id: string;
  name?: string;
  brand?: string | null;
  image?: string | null;
  /** Decimal serialized by SSE as a string, or a plain number. */
  price?: number | string | null;
  regular_price?: number | string | null;
  offer_price?: number | string | null;
  savings_pct?: number | null;
  offer_valid_until?: string | null;
  recommendation_reason?: string | null;
  price_text?: string;
  short_description?: string | null;
  has_variants?: boolean;
  single_sku?: string | null;
  availability?: string;
  variants?: { sku: string; talla?: string | null; color?: string | null }[];
};

/** Tarjeta que pintan `ProductCard` y `CarruselProductos`. */
export type CatalogCardItem = OfferPrice & {
  ref?: number;
  product_id: string;
  /** Solo productos sin variantes (agregado directo). */
  sku?: string;
  name: string;
  brand?: string | null;
  price: number | null;
  /** Legacy text retained for compatibility; display uses validated PEN amounts. */
  priceText?: string;
  image?: string | null;
  shortDescription?: string;
  recommendationReason?: string;
  hasVariants: boolean;
  availability: AvailabilityState;
  /** Solo semillas mock en el chat hasta que el bucle las reemplace. */
  talla?: string;
  color?: string;
};

/** Estados crudos del módulo Inventario → estado de dominio. `STOCK_BAJO` = pocas. */
const BACKEND_STATES: Record<string, AvailabilityState> = {
  DISPONIBLE: "DISPONIBLE",
  STOCK_BAJO: "POCAS_UNIDADES",
  POCAS_UNIDADES: "POCAS_UNIDADES",
  AGOTADO: "AGOTADO",
  INDETERMINADO: "INDETERMINADO",
};

/** Mapeo único: cualquier estado crudo desconocido cae a INDETERMINADO. */
export function toAvailabilityState(value: unknown): AvailabilityState {
  if (typeof value !== "string") return "INDETERMINADO";
  return BACKEND_STATES[value] ?? "INDETERMINADO";
}

/** PEN amount from the server; unavailable is never represented as zero. */
export function formatPrice(value: { priceText?: string; price: number | null }): string {
  const amount = parseAmount(value.price);
  return amount === null ? "Precio no disponible" : `S/ ${amount.toFixed(2)}`;
}

/** Acepta solo URLs http/https como origen de imagen; el resto cae al placeholder. */
export function safeImageUrl(raw: unknown): string | undefined {
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {
    return undefined;
  }
  return undefined;
}

function offerFields(item: BackendCarouselItem): OfferPrice {
  return {
    regularPrice: parseAmount(item.regular_price),
    offerPrice: parseAmount(item.offer_price),
    savingsPct: typeof item.savings_pct === "number" && Number.isInteger(item.savings_pct) && item.savings_pct > 0 && item.savings_pct <= 100 ? item.savings_pct : null,
    offerValidUntil: parseIsoDate(item.offer_valid_until),
    // An explicitly malformed expiry must not grant indefinite offer styling.
    offerExpiryInvalid: item.offer_valid_until != null && parseIsoDate(item.offer_valid_until) === null,
  };
}

function toText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  return text === "" ? undefined : text;
}

export function mapCarouselItem(item: BackendCarouselItem, ref: number): CatalogCardItem {
  return {
    ref: typeof item.ref === "number" && Number.isInteger(item.ref) ? item.ref : ref,
    ...offerFields(item),
    recommendationReason: toText(item.recommendation_reason),
    product_id: item.product_id,
    sku: toText(item.single_sku),
    name: toText(item.name) ?? item.product_id,
    brand: toText(item.brand) ?? null,
    price: parseAmount(item.price),
    priceText: toText(item.price_text),
    image: item.image ?? undefined,
    shortDescription: toText(item.short_description),
    hasVariants: item.has_variants === true,
    availability: toAvailabilityState(item.availability),
    talla: item.talla,
    color: item.color,
  };
}

/** Detalle con variantes reales (SPEC-09). Reutiliza el resumen del carrusel. */
export type CatalogDetail = OfferPrice & {
  product_id: string;
  name: string;
  brand?: string | null;
  shortDescription?: string;
  image?: string | null;
  price: number | null;
  priceText?: string;
  recommendationReason?: string;
  hasVariants: boolean;
  /** SKU directo cuando el producto no tiene variantes (`single_sku`). */
  singleSku?: string;
  availability: AvailabilityState;
  variants: { sku: string; talla?: string | null; color?: string | null }[];
  tallas: string[];
  colores: string[];
};

export function mapProductDetail(data: BackendProductDetail): CatalogDetail {
  const name = toText(data.name) ?? data.product_id;
  const variants = Array.isArray(data.variants) ? data.variants.filter((v) => v != null && typeof v.sku === "string" && (v.talla == null || typeof v.talla === "string") && (v.color == null || typeof v.color === "string")) : [];
  const tallas = [...new Set(variants.map((v) => v.talla).filter(Boolean))] as string[];
  const colores = [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[];
  return {
    product_id: data.product_id,
    ...offerFields(data),
    recommendationReason: toText(data.recommendation_reason),
    name,
    brand: toText(data.brand) ?? null,
    shortDescription: toText(data.short_description),
    image: data.image ?? undefined,
    price: parseAmount(data.price),
    priceText: toText(data.price_text),
    hasVariants: typeof data.has_variants === "boolean" ? data.has_variants : variants.length > 0,
    singleSku: toText(data.single_sku),
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
