"use client";

import { useDialogoModal } from "@/shared/ui/useDialogoModal";
import { CameraIcon, PhotoIcon } from "@/shared/ui/icons";

/**
 * Hoja de origen de la imagen: "Galería" o "Tomar foto" (SPEC-23 Req. 1).
 * Solo elige el selector nativo; la cámara usa `capture="environment"` sin pedir
 * un permiso propio, y ambas fuentes pasan por las mismas validaciones.
 */
export function AttachmentSourceSheet({
  onGaleria,
  onCamara,
  onCerrar,
}: {
  onGaleria: () => void;
  onCamara: () => void;
  onCerrar: () => void;
}) {
  const dialogoRef = useDialogoModal<HTMLDivElement>(onCerrar);

  const opcion =
    "wf-btn w-full py-3 px-4 flex items-center gap-3 text-[13px] font-bold bg-white text-text-primary border border-border-default hover:border-accent-signal";

  return (
    <div data-capa-modal className="absolute inset-0 z-40 flex items-end justify-center bg-surface-ink/60 fade-in">
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
        aria-labelledby="adjunto-origen-titulo"
        aria-describedby="adjunto-origen-formatos"
        className="relative pop-in w-full max-w-[480px] bg-surface-cloud rounded-t-lg shadow-xl p-4 pb-6 flex flex-col gap-2"
      >
        <h2 id="adjunto-origen-titulo" className="font-heading text-[16px] text-text-primary">
          Agregar imagen
        </h2>
        <p id="adjunto-origen-formatos" className="text-[12px] text-text-secondary">
          JPG, PNG o WEBP de hasta 5 MB. Hasta 3 imágenes por mensaje.
        </p>
        <button type="button" onClick={onGaleria} className={opcion}>
          <PhotoIcon size={20} />
          Galería
        </button>
        <button type="button" onClick={onCamara} className={opcion}>
          <CameraIcon size={20} />
          Tomar foto
        </button>
        <button
          type="button"
          onClick={onCerrar}
          className="mt-1 text-[12px] font-semibold underline text-text-secondary"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
