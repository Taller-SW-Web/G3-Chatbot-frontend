"use client";

import { useState } from "react";
import { ThumbUpIcon, ThumbDownIcon, CopyIcon, CheckIcon } from "./icons";

/** Feedback bajo la última respuesta del bot (iconos Lucide vía Iconify). */
export function BotFeedback({ text }: { text: string }) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [copied, setCopied] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* portapapeles no disponible */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const btn = (active: boolean) =>
    `w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${active ? "bg-surface-ink text-text-inverse border-surface-ink" : "bg-white text-text-secondary border-border-default hover:border-accent-signal"}`;

  return (
    <div className="flex items-center gap-1.5" aria-label="Calificar respuesta">
      <button aria-label="Me sirvió" title="Me sirvió" onClick={() => setVote((v) => (v === "up" ? null : "up"))} className={btn(vote === "up")}>
        <ThumbUpIcon size={16} />
      </button>
      <button aria-label="No me sirvió" title="No me sirvió" onClick={() => setVote((v) => (v === "down" ? null : "down"))} className={btn(vote === "down")}>
        <ThumbDownIcon size={16} />
      </button>
      <button aria-label="Copiar respuesta" title={copied ? "¡Copiado!" : "Copiar"} onClick={copiar} className={btn(copied)}>
        {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      </button>
      {copied && <span className="text-[11px] font-semibold text-success-default">¡Copiado!</span>}
    </div>
  );
}
