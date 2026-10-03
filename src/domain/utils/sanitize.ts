import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitiza todo texto del LLM / módulos antes de pintar.
 * Regla R7 XSS: jamás `dangerouslySetInnerHTML` con contenido sin pasar por aquí.
 * Sin React, sin fetch, sin window.
 */
export function sanitize(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
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
