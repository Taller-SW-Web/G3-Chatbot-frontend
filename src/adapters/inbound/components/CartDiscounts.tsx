import { parseCartDiscounts } from "@/domain/utils/cartDiscounts";
import { sanitize } from "@/domain/utils/sanitize";
import { PriceTag } from "./PriceTag";

/** Shared presentation boundary for REST, persisted and streamed cart discounts. */
export function CartDiscounts({ value }: { value: unknown }) {
  const discounts = parseCartDiscounts(value);
  return (
    <>
      {discounts.items.map((discount, index) => (
        <div key={index} className="flex justify-between gap-2 text-[13px]">
          <span className="text-text-secondary">{sanitize(discount.name)}</span>
          <span className="inline-flex shrink-0 items-baseline gap-1 whitespace-nowrap font-semibold text-success-default">- <PriceTag price={discount.amount} /></span>
        </div>
      ))}
      {discounts.unavailable && (
        <p role="status" className="text-[12px] text-text-secondary">
          No pudimos mostrar todos los descuentos.
        </p>
      )}
    </>
  );
}
