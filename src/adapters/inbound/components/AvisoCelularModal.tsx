"use client";

import { LockIcon } from "./icons";
import { useChatStore } from "@/application/state/chatStore";

/**
 * Aviso: debes verificar tu número antes de comprar (SPEC-04).
 * Paridad con Mockups-Wireframes.
 */
export function AvisoCelularModal({
  onVerificar,
  onClose,
}: {
  onVerificar: () => void;
  onClose: () => void;
}) {
  const cliente = useChatStore((s) => s.cliente);
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-surface-ink/60 fade-in p-5" onClick={onClose}>
      <div className="pop-in w-full max-w-[320px] bg-white rounded-lg shadow-xl max-h-[85%] overflow-y-auto no-scrollbar p-6 flex flex-col items-center gap-3 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="wf-check w-16 h-16 rounded-full flex items-center justify-center bg-warning-background text-warning-default"><LockIcon size={24} /></div>
        <h2 className="font-heading text-[20px]">VERIFICA TU NÚMERO</h2>
        <p className="text-[14px] text-text-secondary">
          Para coordinar la entrega y comprar necesitamos confirmar tu celular {cliente?.celularEnmascarado ?? ""}. Debes verificar tu número antes de comprar.
        </p>
        <button onClick={onVerificar} className="wf-btn w-full py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover">VERIFICAR AHORA</button>
        <button onClick={onClose} className="text-[12px] font-semibold underline text-text-secondary">Seguir viendo</button>
      </div>
    </div>
  );
}
