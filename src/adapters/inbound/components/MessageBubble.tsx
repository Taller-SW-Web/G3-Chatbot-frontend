"use client";
import type { ReactNode } from "react";
import type { Bloque, BloqueError, BloqueTexto } from "@/domain/entities/Bloque";
import { sanitize } from "@/domain/utils/sanitize";

type Props = {
  texto: string;
  rol: "user" | "bot";
  /** Validated TEXTO/ERROR blocks (SPEC-05 Req. 4). */
  bloques?: Bloque[];
  /** Tokens arriving over WS ("typing live" effect). */
  streaming?: boolean;
  /** First bot reply: Botleta introduction. */
  isFirstAssistant?: boolean;
};

/* Códigos de pedido / reembolso / reclamo en negrita para no equivocarse al leerlos. */
const CODE_PATTERN = /(#[A-Z]-0312|#[A-Z]-\d{4}|#?REC-2026-\d{4}|#?DEV-2026-\d{5}|#?R-0312)/g;
const CODE_TEST = /^(#[A-Z]-0312|#[A-Z]-\d{4}|#?REC-2026-\d{4}|#?DEV-2026-\d{5}|#?R-0312)$/;

/* Promociones vigentes en negrita. Grupos (?:...) para que split no duplique fechas. */
const PROMO_PATTERN = /(Running\s*-20%(?:\s*hasta\s*30\s*sep)?|Urbano\s*2x1(?:\s*hasta\s*28\s*sep)?|Urbano\s*2×1(?:\s*hasta\s*28\s*sep)?)/gi;
const PROMO_TEST = /^(Running\s*-20%(?:\s*hasta\s*30\s*sep)?|Urbano\s*2x1(?:\s*hasta\s*28\s*sep)?|Urbano\s*2×1(?:\s*hasta\s*28\s*sep)?)$/i;

function promoBold(texto: string, dark: boolean, pref: string): ReactNode {
  const partes = texto.split(PROMO_PATTERN);
  if (partes.length === 1) return texto;
  return partes.map((p, j) =>
    PROMO_TEST.test(p) ? (
      <strong key={`${pref}-${j}`} className={`font-bold ${dark ? "text-text-inverse" : "text-text-primary"}`}>{p}</strong>
    ) : (
      <span key={`${pref}-${j}`}>{p}</span>
    )
  );
}

/** Texto del chat con códigos y promociones en negrita. Sin innerHTML (R7). */
export function renderChatText(texto: string, dark = false): ReactNode {
  const limpio = sanitize(texto);
  const partes = limpio.split(CODE_PATTERN);
  if (partes.length === 1) return promoBold(limpio, dark, "p");
  return partes.map((p, i) =>
    CODE_TEST.test(p) ? (
      <strong key={i} className={`font-bold ${dark ? "text-text-inverse" : "text-text-primary"}`}>{p}</strong>
    ) : (
      <span key={i}>{promoBold(p, dark, `p${i}`)}</span>
    )
  );
}

function esBloqueTexto(b: Bloque): b is BloqueTexto {
  return b.tipo === "TEXTO" && typeof (b as BloqueTexto).texto === "string";
}

function esBloqueError(b: Bloque): b is BloqueError {
  return b.tipo === "ERROR" && typeof (b as BloqueError).code === "string";
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

/** Burbuja de mensaje. Todo texto pasa por sanitize (R7). */
export function MessageBubble({ texto, rol, bloques = [], streaming = false, isFirstAssistant = false }: Props) {
  if (rol === "user") {
    return (
      <div
        data-testid="message-bubble"
        data-rol="user"
        className="msg-in self-end max-w-[80%] rounded-md rounded-br-xs px-3 py-2 text-[14px] leading-5 bg-surface-ink text-text-inverse"
      >
        {renderChatText(texto, true)}
      </div>
    );
  }
  return (
    <div
      data-testid="message-bubble"
      data-rol="bot"
      aria-live={streaming ? "polite" : undefined}
      className="msg-in self-start max-w-[85%] rounded-md rounded-bl-xs px-3 py-2 text-[14px] leading-5 bg-white text-text-primary border border-border-default"
    >
      {isFirstAssistant && (
        <p data-testid="presentacion-botleta">
          Soy Botleta, asistente virtual. Conversas con un asistente virtual con IA.
          No compartas contraseñas ni datos de tarjeta.
        </p>
      )}
      {texto && renderChatText(texto)}
      {bloques.map((bloque, i) => {
        if (esBloqueTexto(bloque)) {
          return <p key={i} data-testid="bloque-texto">{renderChatText(bloque.texto)}</p>;
        }
        if (esBloqueError(bloque)) {
          return (
            <p key={i} data-testid="bloque-error" data-code={bloque.code}>
              {mensajePorCode(bloque.code)}
            </p>
          );
        }
        return null;
      })}
      {streaming && <span data-testid="typing-indicator" aria-label="escribiendo" />}
    </div>
  );
}