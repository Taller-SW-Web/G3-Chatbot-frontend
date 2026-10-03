"use client";

import type { ReactNode } from "react";
import { MessageBubble } from "./MessageBubble";
import { BotFeedback } from "./BotFeedback";
import { LockIcon } from "./icons";

export type BotAccion = { etiqueta: string; href: string };

export type UIMsg =
  | { from: "user"; text: string }
  | { from: "bot"; text: string; accion?: BotAccion }
  | { from: "bot-cards" }
  | { from: "bot-login" };

/**
 * Ventana de chat: lista + typing + quick replies slot.
 * El CTA bajo el mensaje del bot requiere sesión; el feedback
 * (pulgar arriba/abajo + copiar) solo va bajo el último mensaje del bot.
 */
export function ChatWindow({
  msgs,
  typing,
  cards,
  loginSlot,
  sesionActiva,
  onAccion,
}: {
  msgs: UIMsg[];
  typing: boolean;
  cards?: (key: number) => ReactNode;
  loginSlot?: (key: number) => ReactNode;
  sesionActiva: boolean;
  onAccion: (href: string) => void;
}) {
  let lastBot = -1;
  msgs.forEach((m, i) => {
    if (m.from === "bot" || m.from === "bot-cards") lastBot = i;
  });

  return (
    <div className="p-3 flex flex-col gap-2 pb-4">
      {msgs.length === 0 && (
        <p className="text-sm text-text-secondary bg-white border border-border-default rounded-md p-4 text-center">
          Nuevo chat. Escribe abajo para empezar.
        </p>
      )}
      {msgs.map((m, i) => {
        if (m.from === "user")
          return <MessageBubble key={i} rol="user" texto={m.text} />;
        if (m.from === "bot")
          return (
            <div key={i} className="self-start w-full max-w-[85%] flex flex-col gap-1.5">
              <MessageBubble rol="bot" texto={m.text} />
              {i === lastBot && <BotFeedback text={m.text} />}
              {m.accion && (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => onAccion(m.accion!.href)}
                    title={sesionActiva ? m.accion.etiqueta : "Inicia sesión para continuar"}
                    className="wf-btn self-start px-4 py-2.5 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover inline-flex items-center gap-2"
                  >
                    {!sesionActiva && <LockIcon size={16} />}
                    {m.accion.etiqueta.toUpperCase()}
                  </button>
                  {!sesionActiva && (
                    <span className="text-[11px] text-text-secondary">Inicia sesión para usar esta opción (sin cuenta no hay historial).</span>
                  )}
                </div>
              )}
            </div>
          );
        if (m.from === "bot-login")
          return loginSlot ? <div key={i}>{loginSlot(i)}</div> : null;
        return (
          <div key={i} className="self-start w-full max-w-[95%] flex flex-col gap-1.5">
            {cards ? cards(i) : null}
            {i === lastBot && <BotFeedback text="Recomendaciones de productos" />}
          </div>
        );
      })}
      {typing && (
        <div
          className="self-start bg-white border border-border-default rounded-full px-3.5 py-2.5 flex items-center gap-1.5"
          aria-label="Escribiendo"
        >
          <span className="tdot" />
          <span className="tdot" style={{ animationDelay: "0.15s" }} />
          <span className="tdot" style={{ animationDelay: "0.3s" }} />
        </div>
      )}
    </div>
  );
}
