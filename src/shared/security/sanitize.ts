import { parseDocument } from "htmlparser2";

/**
 * Sanitiza todo texto del LLM / módulos antes de pintar (README §1.4, riesgo XSS R7).
 * Quita toda etiqueta y devuelve TEXTO PLANO, solo para renderizar como hijo de React
 * (React escapa al pintar). Nunca usar el resultado en `dangerouslySetInnerHTML`.
 * Usa htmlparser2 para extraer solo nodos de texto: no carga `jsdom` ni depende
 * de regex. El resultado es texto plano y funciona igual en SSR y en el navegador.
 */
type Nodo = {
  type: string;
  data?: string;
  name?: string;
  children?: Nodo[];
};

/** Extrae solo nodos de texto; descarta por completo script/style y las etiquetas. */
function extraerTexto(nodo: Nodo): string {
  if (nodo.type === "text") return nodo.data ?? "";
  if (nodo.type === "script" || nodo.type === "style") return "";
  if (nodo.name === "script" || nodo.name === "style") return "";
  return (nodo.children ?? []).map(extraerTexto).join("");
}

export function sanitize(input: string): string {
  return extraerTexto(parseDocument(input, { decodeEntities: true }) as unknown as Nodo);
}

export function maskEmail(correo: string): string {
  const [user, domain] = correo.split("@");
  if (!domain || !user) return correo;
  return `${user.charAt(0)}****@${domain}`;
}

export function maskCelular(celular: string): string {
  const digits = celular.replace(/\D/g, "");
  const last3 = digits.slice(-3);
  const prefix = celular.trim().startsWith("+") && digits.length > 9
    ? `+${digits.slice(0, -9)} `
    : "";
  return `${prefix}*****${last3}`;
}
