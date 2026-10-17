import type {
  BuscarProductosInput,
  ChatbotApiPort,
} from "@/ports/outbound/ChatbotApiPort";
import {
  mapCarouselItem,
  type BackendCarouselItem,
  type CatalogCardItem,
} from "@/domain/entities/CatalogoUI";

/** Búsqueda paginada con datos reales (SPEC-06). Sin mocks. */
export async function buscarProductosUseCase(
  api: ChatbotApiPort,
  input: BuscarProductosInput
): Promise<{ items: CatalogCardItem[]; total: number; mensaje?: string }> {
  const page = await api.buscarProductos({
    q: input.q?.trim() || undefined,
    categoria: input.categoria,
    marca: input.marca,
    precioMin: input.precioMin,
    precioMax: input.precioMax,
    orden: input.orden,
    pagina: input.pagina ?? 1,
    tamanio: Math.min(Math.max(input.tamanio ?? 10, 1), 10),
  });
  const raw = Array.isArray(page.items) ? page.items : [];
  return {
    items: raw.map((item, i) =>
      mapCarouselItem(item as BackendCarouselItem, i + 1)
    ),
    total: typeof page.total === "number" ? page.total : raw.length,
    mensaje: page.mensaje,
  };
}
