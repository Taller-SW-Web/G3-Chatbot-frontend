"use client";

import { PhotoIcon } from "@/shared/ui/icons";
import { useDialogoModal } from "@/shared/ui/useDialogoModal";

/**
 * Aviso de privacidad antes de la primera carga de una imagen (SPEC-23 Req. 2).
 * La confirmación se recuerda en el dispositivo; si no hay localStorage, el
 * aviso vuelve a mostrarse en el siguiente intento.
 */
export function AttachmentPrivacyNotice({
  onAceptar,
  onCerrar,
}: {
  onAceptar: () => void;
  onCerrar: () => void;
}) {
  const dialogoRef = useDialogoModal<HTMLDivElement>(onCerrar);
  return (
    <div data-capa-modal className="absolute inset-0 z-40 flex items-center justify-center bg-surface-ink/60 fade-in p-5">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 cursor-default"
        onClick={onCerrar}
      />
      <div
        ref={dialogoRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjunto-privacidad-titulo"
        className="relative pop-in w-full max-w-[340px] bg-white rounded-lg shadow-xl p-5 flex flex-col gap-3 outline-none"
      >
        <div className="flex items-center gap-2">
          <div className="wf-check w-10 h-10 rounded-full flex items-center justify-center bg-warning-background text-warning-default">
            <PhotoIcon size={20} />
          </div>
          <h2 id="adjunto-privacidad-titulo" className="font-heading text-[16px]">
            Antes de adjuntar una imagen
          </h2>
        </div>
        <p className="text-[13px] text-text-secondary">
          Las imágenes que adjuntes se envían a un asistente con IA y se guardan de forma privada.
          Evita fotos con rostros, documentos, tarjetas o datos personales.
        </p>
        <a href="/privacidad" className="text-[12px] font-semibold underline text-text-primary">
          Política de privacidad
        </a>
        <button
          type="button"
          onClick={onAceptar}
          className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink"
        >
          Entendido, adjuntar
        </button>
        <button
          type="button"
          onClick={onCerrar}
          className="text-[12px] font-semibold underline text-text-secondary"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
