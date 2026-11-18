/** Pure mapping from backend chat blocks to UI items and direct actions.
 * No React, no fetch (hexagonal domain/).
 */
import type {
  BloqueCarritoResumen,
  BloqueCarrusel,
  BloqueDetalle,
  BloqueFormulario,
  BloqueSelectorVariante,
  DatosCarritoBloque,
} from "../entities/Bloque";
import {
  mapCarouselItem,
  mapProductDetail,
  isProductRow,
  type CatalogCardItem,
  type CatalogDetail,
} from "../entities/CatalogoUI";

/** Direct action in the shape the chat page already dispatches (`id` is the action type). */
export type AccionDirecta = {
  id: string;
  etiqueta: string;
  payload: Record<string, unknown>;
};

export function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Validate public actions without interpreting recommendation or offer policy. */
export function parseQuickActions(value: unknown): { pregunta?: string; acciones: AccionDirecta[] } | null {
  if (!esObjeto(value) || !Array.isArray(value.acciones)) return null;
  const acciones: AccionDirecta[] = [];
  for (const action of value.acciones) {
    if (
      !esObjeto(action) || typeof action.id !== "string" || !action.id.trim() ||
      typeof action.etiqueta !== "string" || !action.etiqueta.trim() ||
      (action.payload != null && !esObjeto(action.payload))
    ) continue;
    acciones.push({ id: action.id, etiqueta: action.etiqueta, payload: action.payload ?? {} });
  }
  return { pregunta: typeof value.pregunta === "string" ? value.pregunta : undefined, acciones };
}

export function carouselMetadata(bloque: BloqueCarrusel): { titulo?: string; variant?: "recomendacion" | "cross_sell" | "ofertas"; partial: boolean } {
  const data = bloque.datos;
  return {
    partial: data?.partial === true,
    titulo: typeof data?.titulo === "string" ? data.titulo : undefined,
    variant: data?.variant === "recomendacion" || data?.variant === "cross_sell" || data?.variant === "ofertas" ? data.variant : undefined,
  };
}

/** Carousel rows, or null when the payload does not carry a product list. */
export function productosDeCarrusel(bloque: BloqueCarrusel): CatalogCardItem[] | null {
  const productos = bloque.datos?.productos;
  if (!Array.isArray(productos)) return null;
  return productos
    .filter(isProductRow)
    .map((p, i) => mapCarouselItem(p, i + 1));
}

/** Product detail, or null when the payload has no product. */
export function detalleDeBloque(bloque: BloqueDetalle): CatalogDetail | null {
  const producto = bloque.datos?.producto;
  if (!isProductRow(producto)) return null;
  return mapProductDetail(producto);
}

/** Cart payload, or null when it has no line list. */
export function datosDeCarrito(bloque: BloqueCarritoResumen): DatosCarritoBloque | null {
  const datos = bloque.datos;
  if (!esObjeto(datos) || !Array.isArray(datos.lineas)) return null;
  return datos;
}

/** Variant attributes the backend is asking for (`talla`, `color`). */
export function faltantesDeSelector(bloque: BloqueSelectorVariante): {
  productId: string;
  faltantes: string[];
  seleccion: Record<string, string>;
} | null {
  const datos = bloque.datos;
  if (!esObjeto(datos) || typeof datos.product_id !== "string" || !datos.product_id.trim()) return null;
  const faltantes = Array.isArray(datos.faltantes)
    ? datos.faltantes.filter((f): f is string => f === "talla" || f === "color")
    : [];
  if (faltantes.length === 0) return null;
  const seleccion: Record<string, string> = {};
  const conocida: unknown = datos.seleccion;
  if (esObjeto(conocida)) {
    for (const atributo of ["talla", "color"]) {
      const valor = conocida[atributo];
      if (typeof valor === "string" && valor.trim() !== "") seleccion[atributo] = valor.trim();
    }
  }
  return { productId: datos.product_id, faltantes, seleccion };
}

export function esFormularioRegistro(bloque: BloqueFormulario): boolean {
  return bloque.formulario === "REGISTRO";
}

/** Card "add": preserve product context for single-SKU cross-sell; otherwise ask for the variant. */
export function accionAgregarDeTarjeta(p: CatalogCardItem): AccionDirecta {
  return {
    id: "AGREGAR_AL_CARRITO",
    etiqueta: "Agregar",
    payload: p.sku ? { sku: p.sku, product_id: p.product_id } : { product_id: p.product_id },
  };
}

export function accionVerDetalle(p: CatalogCardItem): AccionDirecta {
  return {
    id: "VER_DETALLE_PRODUCTO",
    etiqueta: "Ver detalle",
    payload: { product_id: p.product_id },
  };
}

/** Add a product with the chosen variant attributes (answer to SELECTOR_VARIANTE). */
export function accionAgregarVariante(
  productId: string,
  seleccion: Record<string, string>
): AccionDirecta {
  const payload: Record<string, unknown> = { product_id: productId };
  if (seleccion.talla) payload.talla = seleccion.talla;
  if (seleccion.color) payload.color = seleccion.color;
  return { id: "AGREGAR_AL_CARRITO", etiqueta: "Agregar", payload };
}

/** Options for one missing attribute, narrowed by the other attribute already chosen. */
export function opcionesDeAtributo(
  detalle: CatalogDetail,
  atributo: string,
  seleccion: Record<string, string>
): string[] {
  const otro = atributo === "talla" ? "color" : "talla";
  const igual = (a: unknown, b: string) => typeof a === "string" && a.trim().toLowerCase() === b.trim().toLowerCase();
  const valores = detalle.variants
    .filter((v) => !seleccion[otro] || igual(v[otro as "talla" | "color"], seleccion[otro]))
    .map((v) => v[atributo as "talla" | "color"])
    .filter((v): v is string => typeof v === "string" && v !== "");
  return [...new Set(valores)];
}
