/*
 * Resaltado de datos que el cliente no debe leer mal: códigos de pedido, reembolso o
 * reclamo y promociones vigentes. Módulo puro (sin React) compartido por el texto plano
 * del chat y por el Markdown del bot.
 */

/* Códigos de pedido / reembolso / reclamo. Un solo grupo de captura para que split conserve el código. */
const CODE_PATTERN = /(#[A-Z]-0312|#[A-Z]-\d{4}|#?REC-2026-\d{4}|#?DEV-2026-\d{5}|#?R-0312)/g;

/* Promociones vigentes. Grupos (?:...) para que split no duplique fechas. */
const PROMO_PATTERN = /(Running\s*-20%(?:\s*hasta\s*30\s*sep)?|Urbano\s*2x1(?:\s*hasta\s*28\s*sep)?|Urbano\s*2×1(?:\s*hasta\s*28\s*sep)?)/gi;

export type SegmentoResaltado = { texto: string; resaltado: boolean };

/** Con un único grupo de captura, split deja las coincidencias en los índices impares. */
function partir(texto: string, patron: RegExp): SegmentoResaltado[] {
  return texto
    .split(patron)
    .map((parte, i) => ({ texto: parte, resaltado: i % 2 === 1 }))
    .filter((s) => s.texto !== "");
}

/**
 * Divide el texto en segmentos ordenados, marcando códigos y promociones.
 * Sin segmentos vacíos; una cadena vacía devuelve una lista vacía.
 */
export function dividirResaltado(texto: string): SegmentoResaltado[] {
  return partir(texto, CODE_PATTERN).flatMap((s) => (s.resaltado ? [s] : partir(s.texto, PROMO_PATTERN)));
}
