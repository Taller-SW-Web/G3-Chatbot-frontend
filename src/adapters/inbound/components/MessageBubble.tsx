import type { ReactNode } from "react";
import { sanitize } from "@/domain/utils/sanitize";

type Props = { texto: string; rol: "user" | "bot" };

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

/** Burbuja de mensaje. Pasa texto por sanitize (R7). */
export function MessageBubble({ texto, rol }: Props) {
  if (rol === "user") {
    return (
      <div className="msg-in self-end max-w-[80%] rounded-md rounded-br-xs px-3 py-2 text-[14px] leading-5 bg-surface-ink text-text-inverse">
        {renderChatText(texto, true)}
      </div>
    );
  }
  return (
    <div className="msg-in self-start max-w-[85%] rounded-md rounded-bl-xs px-3 py-2 text-[14px] leading-5 bg-white text-text-primary border border-border-default">
      {renderChatText(texto)}
    </div>
  );
}
