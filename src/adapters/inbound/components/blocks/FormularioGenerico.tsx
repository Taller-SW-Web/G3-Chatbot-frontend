"use client";

import type { ReactNode } from "react";

/** Contenedor FORMULARIO 8 subtipos. contratos §2.1 */
export function FormularioGenerico({
  titulo,
  children,
  onSubmit,
  etiqueta = "ENVIAR",
}: {
  titulo: string;
  children: ReactNode;
  onSubmit: () => void;
  /** Submit button label. */
  etiqueta?: string;
}) {
  return (
    <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
      <p className="font-heading text-[15px] uppercase">{titulo}</p>
      {children}
      <button onClick={onSubmit}
        className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink">{etiqueta}</button>
    </div>
  );
}
