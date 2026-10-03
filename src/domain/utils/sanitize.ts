import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitiza todo texto del LLM / módulos antes de pintar (README §1.4, riesgo XSS R7).
 * Quita toda etiqueta y devuelve TEXTO PLANO, solo para renderizar como hijo de React
 * (React escapa al pintar). Nunca usar el resultado en `dangerouslySetInnerHTML`.
 * Sin React, sin fetch, sin window.
 */
export function sanitize(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    RETURN_DOM_FRAGMENT: true,
  }).textContent ?? "";
}

export function maskEmail(correo: string): string {
  const [user, domain] = correo.split("@");
  if (!domain || !user) return correo;
  return `${user.charAt(0)}****@${domain}`;
}

export function maskCelular(celular: string): string {
  const digits = celular.replace(/\D/g, "");
  const last3 = digits.slice(-3);
  const prefix = celular.trim().startsWith("+")
    ? `${celular.trim().split(" ")[0]} `
    : "";
  return `${prefix}*****${last3}`;
}