"use client";

import { PhotoIcon } from "@/shared/ui/icons";

/** Botón "Adjuntar" del compositor (SPEC-23 Req. 1). */
export function AttachmentButton({
  onClick,
  disabled = false,
  lleno = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  lleno?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label="Adjuntar imagen"
      title={lleno ? "Puedes adjuntar hasta 3 imágenes por mensaje" : "Adjuntar imagen"}
      onClick={onClick}
      disabled={disabled || lleno}
      className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse disabled:opacity-45 disabled:cursor-not-allowed"
    >
      <PhotoIcon size={20} />
    </button>
  );
}
