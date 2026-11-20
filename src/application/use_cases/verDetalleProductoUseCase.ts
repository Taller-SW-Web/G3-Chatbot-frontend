import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";
import {
  mapProductDetail,
  isProductRow,
  type CatalogDetail,
} from "@/domain/entities/CatalogoUI";

/** Detalle con variantes reales (SPEC-09). Sin mocks. */
export async function verDetalleProductoUseCase(
  api: ChatbotApiPort,
  productId: string
): Promise<CatalogDetail> {
  if (!productId.trim()) throw new Error("productId requerido");
  const data = (await api.verDetalleProducto(
    productId.trim()
  ));
  if (!isProductRow(data) || data.product_id !== productId.trim()) throw new Error("Detalle de producto inválido");
  return mapProductDetail(data);
}
