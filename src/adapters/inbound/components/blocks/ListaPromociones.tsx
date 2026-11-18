import { formatPromotionDate, type PromotionSummary } from "@/domain/entities/PromocionesUI";
import { sanitize } from "@/domain/utils/sanitize";

/** Only public summaries from G3; never provider benefits or coupon data. */
export function ListaPromociones({ promos, unavailable = false }: { promos: PromotionSummary[] | null; unavailable?: boolean }) {
  return (
    <section aria-label="Promociones" data-testid="lista-promociones" className="rounded-md bg-surface-ink text-text-inverse p-3 flex flex-col gap-2">
      <h3 className="font-heading text-[15px] uppercase text-accent-volt">Promociones</h3>
      {unavailable ? <p role="status" className="text-[13px]">No pudimos consultar las promociones ahora. Vuelve a intentar en un momento.</p> : promos === null ? <p role="status" className="text-[13px]">No pudimos mostrar las promociones. Vuelve a consultar las ofertas.</p> : promos.length === 0 ? <p className="text-[13px]">No hay promociones vigentes ahora mismo.</p> : (
        <ul className="flex flex-col gap-3">
          {promos.map((promo) => (
            <li key={promo.promotion_id} className="flex flex-col gap-1 text-[13px] break-words">
              <span className="font-semibold">{sanitize(promo.name)}</span>
              <span className="text-text-inverse-soft">Desde el {formatPromotionDate(promo.valid_from)}{promo.valid_until ? ` hasta el ${formatPromotionDate(promo.valid_until)}` : " · Sin fecha de fin informada"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
