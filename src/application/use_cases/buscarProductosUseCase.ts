import type {
  BuscarProductosInput,
  ChatbotApiPort,
} from "@/ports/outbound/ChatbotApiPort";
import {
  mapCarouselItem,
  isProductRow,
  type CatalogCardItem,
} from "@/domain/entities/CatalogoUI";

/** Búsqueda paginada con datos reales (SPEC-06). Sin mocks. */
export async function buscarProductosUseCase(
  api: ChatbotApiPort,
  input: BuscarProductosInput
): Promise<{ items: CatalogCardItem[]; total: number; mensaje?: string; partial: boolean }> {
  const page = await api.buscarProductos({
    soloOfertas: input.soloOfertas,
    q: input.q?.trim() || undefined,
    categoria: input.categoria,
    marca: input.marca,
    precioMin: input.precioMin,
    precioMax: input.precioMax,
    orden: input.orden,
    pagina: input.pagina ?? 1,
    tamanio: Math.min(Math.max(input.tamanio ?? 10, 1), 10),
  });
  if (!page || !Array.isArray(page.items)) throw new Error("Catálogo inválido");
  const raw = page.items;
  const valid = raw.filter(isProductRow);
  return {
    items: valid.map((item, i) =>
      mapCarouselItem(item, i + 1)
    ),
    partial: page.partial === true || valid.length !== raw.length,
    total: typeof page.total === "number" ? page.total : raw.length,
    mensaje: page.mensaje,
  };
}
