/** Pure session helpers (SPEC-03). No React, no network, no storage. */

export const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000;
export const REFRESH_MARGIN_MS = 60 * 1000;

/** True when the token expires within the refresh margin (SPEC-03 Req. 5). */
export function isTokenExpiringSoon(expiraEn: number | null, nowMs = Date.now()): boolean {
  if (!expiraEn) return false;
  return expiraEn - nowMs < REFRESH_MARGIN_MS;
}

/** Friendly greeting after login (SPEC-03 Req. 3, no pending action). */
export function buildLoginGreeting(nombre?: string | null): string {
  const first = (nombre ?? "").trim().split(" ")[0];
  return first ? `Hola, ${first}` : "Hola";
}
