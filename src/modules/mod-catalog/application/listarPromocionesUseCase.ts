import type { CatalogoPort } from "@/modules/mod-catalog/ports/catalogoPort";
import {
  parsePromotions,
  type PromotionSummary,
} from "@/modules/mod-catalog/domain/entities/PromocionesUI";

/**
 * Promociones vigentes para el banner de la home (SPEC-05 Req. 2, SPEC-08).
 * Devuelve `null` si la respuesta no es una lista de promociones válida.
 */
export async function listarPromocionesUseCase(api: CatalogoPort): Promise<PromotionSummary[] | null> {
  return parsePromotions(await api.listarPromociones());
}
