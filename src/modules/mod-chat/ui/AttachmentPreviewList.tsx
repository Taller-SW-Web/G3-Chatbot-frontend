"use client";

import type { AdjuntoPendiente } from "@/modules/mod-chat/application/useAdjuntosChat";

/** Miniaturas de las imágenes pendientes con progreso, quitar y reintentar (SPEC-23 Req. 1). */
export function AttachmentPreviewList({
  pendientes,
  onQuitar,
  onReintentar,
}: {
  pendientes: AdjuntoPendiente[];
  onQuitar: (id: string) => void;
  onReintentar: (id: string) => void;
}) {
  if (pendientes.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2 px-1 pb-2" aria-label="Imágenes adjuntas">
      {pendientes.map((adjunto, i) => (
        <li
          key={adjunto.id}
          data-testid="adjunto-pendiente"
          className="relative w-20 rounded-md border border-border-default bg-white p-1 flex flex-col gap-1"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={adjunto.urlLocal}
            alt={`Imagen adjunta ${i + 1} de ${pendientes.length}`}
            className="w-full h-16 object-cover rounded-sm"
          />
          {adjunto.estado === "SUBIENDO" && (
            <span role="status" className="text-[10px] text-text-secondary">
              {adjunto.progreso}%
            </span>
          )}
          {adjunto.estado === "ERROR" && (
            <>
              <span role="alert" className="text-[10px] text-error-default leading-tight">
                {adjunto.error}
              </span>
              <button
                type="button"
                onClick={() => onReintentar(adjunto.id)}
                className="text-[10px] font-bold underline text-text-primary text-left"
              >
                Reintentar
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => onQuitar(adjunto.id)}
            aria-label={`Quitar imagen ${i + 1}`}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-surface-ink text-text-inverse text-[11px] font-bold flex items-center justify-center"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
