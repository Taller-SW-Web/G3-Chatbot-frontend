'use client';
/** MessageBubble (H2-05 David, SPEC-05 motor-conversacion Req. 4).
 *
 * Componente estático con datos mock (H2-05): pinta un mensaje + sus bloques
 * TEXTO/ERROR ya validados. No llama a Axios/fetch/localStorage: recibe todo
 * por props desde ChatPage/useChat. Todo texto pasa por sanitizeText (R7 XSS).
 */
import type { Bloque, BloqueError, BloqueTexto } from "../../domain/entities/Bloque";
import type { Mensaje } from "../../domain/entities/Mensaje";
import { sanitizeText } from "../../domain/utils/sanitize";

export interface MessageBubbleProps {
  mensaje: Mensaje;
  bloques: Bloque[];
  /** Tokens llegando por WS (efecto "escribiendo en vivo"). */
  streaming?: boolean;
  /** Primera respuesta del asistente: prefijo presentación Botleta. */
  isFirstAssistant?: boolean;
}

function esBloqueTexto(b: Bloque): b is BloqueTexto {
  return (b as BloqueTexto).tipo === "TEXTO" && typeof (b as BloqueTexto).texto === "string";
}

function esBloqueError(b: Bloque): b is BloqueError {
  return (b as BloqueError).tipo === "ERROR" && typeof (b as BloqueError).code === "string";
}

/** Mensaje de error ramificado por code (contratos §2.8), nunca por texto. */
function mensajePorCode(code: string): string {
  switch (code) {
    case "REQUIERE_SESION":
      return "Inicia sesión para continuar.";
    case "STOCK_INSUFICIENTE":
      return "No hay stock suficiente para esa cantidad.";
    case "CARRITO_DESACTUALIZADO":
      return "El carrito cambió: revisa el nuevo total antes de pagar.";
    case "DEMASIADAS_SOLICITUDES":
      return "Vas muy rápido: espera un momento e inténtalo de nuevo.";
    default:
      return "Hubo un problema. Inténtalo de nuevo.";
  }
}

export function MessageBubble({
  mensaje,
  bloques,
  streaming = false,
  isFirstAssistant = false,
}: MessageBubbleProps) {
  const esCliente = mensaje.rol === "cliente";
  return (
    <div
      data-testid="message-bubble"
      data-rol={mensaje.rol}
      aria-live={streaming ? "polite" : undefined}
    >
      {isFirstAssistant && !esCliente && (
        <p data-testid="presentacion-botleta">
          Soy Botleta, asistente virtual. Conversas con un asistente virtual con IA.
          No compartas contraseñas ni datos de tarjeta.
        </p>
      )}
      {bloques.map((bloque, i) => {
        if (esBloqueTexto(bloque)) {
          return <p key={i} data-testid="bloque-texto">{sanitizeText(bloque.texto)}</p>;
        }
        if (esBloqueError(bloque)) {
          return (
            <p key={i} data-testid="bloque-error" data-code={bloque.code}>
              {sanitizeText(mensajePorCode(bloque.code))}
            </p>
          );
        }
        return null;
      })}
      {streaming && <span data-testid="typing-indicator" aria-label="escribiendo" />}
    </div>
  );
}

/** Mock canónico H2-05 (ChatPage lo reemplaza por datos del WS). */
export const mockMensajeAsistente: Mensaje = {
  id: "msg-1",
  conversacionId: "conv-1",
  rol: "asistente",
  timestamp: "2026-10-03T00:00:00Z",
};

export const mockBloquesBienvenida: Bloque[] = [
  { tipo: "TEXTO", texto: "Hola, ¿qué zapatillas buscas hoy?" } as BloqueTexto,
];
