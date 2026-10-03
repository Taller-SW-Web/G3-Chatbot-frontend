"use client";

import { useState } from "react";
import { PlusIcon } from "../icons";

export type CardItem = {
  sku: string;
  nombre: string;
  precio: number;
  talla: string;
  color: string;
  categoria?: string;
};

/** CARRUSEL_PRODUCTOS max 10 + Ver más. SPEC-06,09 */
export function CarruselProductos({
  titulo,
  productos,
  onAdd,
  onDetalle,
}: {
  titulo: string;
  productos: CardItem[];
  onAdd: (p: CardItem) => void;
  onDetalle: (p: CardItem) => void;
}) {
  const [verMas, setVerMas] = useState(false);
  const visibles = verMas ? productos.slice(0, 10) : productos.slice(0, 2);
  return (
    <div className="self-start w-full rounded-md bg-white border border-border-default p-2 flex flex-col gap-2 wf-card">
      <p className="px-1 text-[14px] font-semibold text-text-primary">{titulo}</p>
      <div className="grid grid-cols-2 gap-2">
        {visibles.map((p) => (
          <div key={p.sku} className="rounded-md p-1.5 bg-white border border-border-default">
            <button onClick={() => onDetalle(p)} className="block w-full" aria-label={`Ver detalle de ${p.nombre}`}>
              <span className="h-24 w-full rounded-md flex items-center justify-center text-[28px]"
                style={{ background: "linear-gradient(135deg, var(--color-surface-ink-soft), var(--color-accent-signal-soft), var(--color-surface-ink))" }} role="img" aria-label={p.nombre}>👟</span>
            </button>
            <button onClick={() => onDetalle(p)} className="text-left mt-1">
              <span className="block font-heading text-[15px] uppercase leading-tight text-text-primary">{p.nombre}</span>
              <span className="block text-[13px] font-semibold text-text-secondary">S/ {p.precio}.00</span>
            </button>
            <div className="flex items-center justify-between mt-1">
              <span className="wf-chip text-[11px] font-semibold px-2 py-0.5 text-text-secondary">{p.talla}</span>
              <button aria-label={`Agregar ${p.nombre}`} onClick={() => onAdd(p)}
                className="w-8 h-8 wf-btn flex items-center justify-center bg-action-primary text-surface-ink"><PlusIcon size={16} /></button>
            </div>
          </div>
        ))}
      </div>
      {productos.length > 2 && (
        <button onClick={() => setVerMas((v) => !v)} className="text-[12px] font-semibold underline text-text-secondary">
          {verMas ? "Ver menos" : "Ver más productos"}
        </button>
      )}
    </div>
  );
}
