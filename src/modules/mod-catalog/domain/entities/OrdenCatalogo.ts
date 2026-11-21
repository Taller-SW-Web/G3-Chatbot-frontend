/** Orden de búsqueda del catálogo (SPEC-06, contrato de `GET /catalogo/productos`). */

export type OrdenCatalogo =
  | "relevancia"
  | "precio_asc"
  | "precio_desc"
  | "nombre_asc"
  | "nombre_desc";

export const ORDEN_CATALOGO_POR_DEFECTO: OrdenCatalogo = "relevancia";

export const OPCIONES_ORDEN_CATALOGO: ReadonlyArray<{ value: OrdenCatalogo; label: string }> = [
  { value: "relevancia", label: "Relevancia" },
  { value: "precio_asc", label: "Menor precio" },
  { value: "precio_desc", label: "Mayor precio" },
  { value: "nombre_asc", label: "Nombre A-Z" },
  { value: "nombre_desc", label: "Nombre Z-A" },
];

/** `relevancia` es el orden natural del backend: no se envía el parámetro. */
export function ordenParaApi(orden: OrdenCatalogo): OrdenCatalogo | undefined {
  return orden === ORDEN_CATALOGO_POR_DEFECTO ? undefined : orden;
}
