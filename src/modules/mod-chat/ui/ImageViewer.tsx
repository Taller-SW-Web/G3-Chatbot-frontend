"use client";

import { XIcon } from "@/shared/ui/icons";

/** Vista ampliada de una imagen dentro de la aplicación (SPEC-23 Req. 7). */
export function ImageViewer({
  url,
  alt,
  onClose,
}: {
  url: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface-ink/80 fade-in p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={alt}
        className="relative max-w-full max-h-full flex flex-col items-end gap-2"
      >
        <button
          type="button"
          aria-label="Cerrar imagen"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
          className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse"
        >
          <XIcon size={20} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          className="max-w-[90vw] max-h-[80vh] object-contain rounded-md bg-white"
        />
      </div>
    </div>
  );
}
