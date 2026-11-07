import { parseAmount } from "../entities/PromocionesUI";

export type ParsedDiscounts = {
  items: { name: string; amount: number }[];
  unavailable: boolean;
};

/** Untrusted G3 data: preserve valid rows and distinguish invalid from empty. */
export function parseCartDiscounts(value: unknown): ParsedDiscounts {
  // Older chat messages may omit this optional field.
  if (value === undefined) return { items: [], unavailable: false };
  if (!Array.isArray(value)) return { items: [], unavailable: true };
  const result: ParsedDiscounts = { items: [], unavailable: false };
  for (const row of value) {
    if (row === null || typeof row !== "object" || Array.isArray(row)) {
      result.unavailable = true;
      continue;
    }
    const amount = parseAmount(row.monto);
    if (amount === null) {
      result.unavailable = true;
      continue;
    }
    const name = typeof row.nombre === "string" ? row.nombre.trim() : "";
    result.items.push({ name: name || "Descuento", amount });
  }
  return result;
}
