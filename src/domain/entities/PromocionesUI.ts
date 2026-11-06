/** Additive G3 offer contract. No discount rules are computed by the client. */
export type OfferPrice = {
  regularPrice?: number | null;
  offerPrice?: number | null;
  savingsPct?: number | null;
  offerValidUntil?: string | null;
  offerExpiryInvalid?: boolean;
};

export type PromotionSummary = {
  promotion_id: string;
  name: string;
  valid_from: string;
  valid_until: string | null;
};

export function parseAmount(value: unknown): number | null {
  if (
    typeof value !== "number" &&
    (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value.trim()))
  ) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

/** Require an ISO instant with timezone; never interpret a date in browser local time. */
export function parseIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  if (Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59 || Number(value.slice(17, 19)) > 59) return null;
  const day = value.slice(0, 10);
  const calendar = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(Date.parse(value)) && Number.isFinite(calendar.getTime()) && calendar.toISOString().slice(0, 10) === day ? value : null;
}

export function formatPromotionDate(value: string): string {
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit", timeZone: "America/Lima" }).format(new Date(value));
}

/** Whitelist public fields. Malformed rows are not promotions or empty success. */
export function parsePromotions(value: unknown): PromotionSummary[] | null {
  if (!Array.isArray(value)) return null;
  const items: PromotionSummary[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object" || typeof row.promotion_id !== "string" || !row.promotion_id.trim() || typeof row.name !== "string" || !row.name.trim()) return null;
    const from = parseIsoDate(row.valid_from);
    const until = parseIsoDate(row.valid_until);
    if (!from || (row.valid_until !== null && !until) || (until && Date.parse(until) < Date.parse(from))) return null;
    items.push({ promotion_id: row.promotion_id, name: row.name, valid_from: from, valid_until: until });
  }
  return items;
}
