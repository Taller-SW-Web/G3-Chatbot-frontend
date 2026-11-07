"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/domain/entities/CatalogoUI";
import { formatPromotionDate, type OfferPrice } from "@/domain/entities/PromocionesUI";

/** Shared price presentation. The effective price and savings belong to G3/G6. */
export function PriceTag({ price, regularPrice, offerPrice, savingsPct, offerValidUntil, offerExpiryInvalid }: OfferPrice & { price: number | null }) {
  const [eligibleExpiry, setEligibleExpiry] = useState<string | null>(null);
  useEffect(() => {
    if (!offerValidUntil) return;
    // Bounded timers also handle expiry on an already-open conversation.
    let timer: ReturnType<typeof setTimeout>;
    function check() {
      const remaining = Date.parse(offerValidUntil!) - Date.now();
      setEligibleExpiry(remaining > 0 ? offerValidUntil! : null);
      if (remaining > 0) timer = setTimeout(check, Math.min(remaining, 2_147_483_647));
    }
    check();
    return () => clearTimeout(timer);
  }, [offerValidUntil]);
  const offer = price !== null && regularPrice != null && offerPrice != null && offerPrice === price && regularPrice > price && !offerExpiryInvalid && (!offerValidUntil || eligibleExpiry === offerValidUntil);
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 tabular-nums">
      {offer && <span className="text-text-secondary text-[12px]"><span className="sr-only">Precio regular </span><s>{formatPrice({ price: regularPrice })}</s></span>}
      <span className="font-semibold">{formatPrice({ price })}</span>
      {offer && savingsPct != null && <span className="rounded-sm bg-accent-volt-soft px-1.5 text-[12px] font-bold text-accent-volt-ink">{savingsPct}% de ahorro</span>}
      {offer && offerValidUntil && <span className="w-full text-[12px] text-text-secondary">Hasta el {formatPromotionDate(offerValidUntil)}</span>}
    </span>
  );
}
