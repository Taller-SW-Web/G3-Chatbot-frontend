/**
 * Devuelve `value` solo si es una ruta interna (mismo origen), si no `null`.
 * Evita open redirects vía `?destino=`: rechaza `//host`, URLs absolutas,
 * `javascript:`, backslashes y caracteres de control que los navegadores normalizan.
 */
export function safeInternalPath(value: string | null | undefined): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  // Backslash, control chars y espacios: los navegadores los tratan como `/` o los eliminan.
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null;
  // `%2F%2F` decodificado no debe convertirse en `//host`.
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  if (decoded.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(decoded.split("?")[0])) return null;
  return value;
}
