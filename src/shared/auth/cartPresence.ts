/**
 * Marca de presencia del carrito (SPEC-11 / #164).
 *
 * `/carrito` se renderiza en el servidor antes de hidratar. Sin una pista del
 * servidor, la primera pintura sería el skeleton y el estado vacío llegaría
 * recién tras hidratar y resolver `GET /carrito`, que es justo el LCP tardío
 * que mide Lighthouse con red/CPU móvil. La cookie sólo indica "hay líneas":
 * el contenido real siempre lo trae el backend.
 */
export const CART_PRESENCE_COOKIE = "chat_cart_present";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Sincroniza la cookie desde el cliente; no-op en el servidor. */
export function syncCartPresenceCookie(present: boolean): void {
  if (typeof document === "undefined") return;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  if (present) {
    document.cookie = `${CART_PRESENCE_COOKIE}=1; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
    return;
  }
  document.cookie = `${CART_PRESENCE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
