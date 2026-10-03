"use client";

import { PlusIcon } from "./icons";
import type { ProductoUI } from "@/domain/entities/ProductoUI";

function PlaceholderImg({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md flex items-center justify-center text-[32px] p-2 ${className}`}
      style={{
        background:
          "linear-gradient(135deg, var(--color-surface-ink-soft), var(--color-accent-signal-soft), var(--color-surface-ink))",
      }}
      role="img"
      aria-label="Producto"
    >
      <span
        aria-hidden
        className="absolute top-0 right-0 w-10 h-10 bg-accent-volt"
        style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
      />
      <span aria-hidden>👟</span>
    </div>
  );
}

/** Tarjeta catálogo en oferta (grid home). Marca, precio tachado, oferta -20% y disponibilidad. */
export function ProductCard({
  producto,
  onDetalle,
}: {
  producto: ProductoUI;
  onDetalle: (p: ProductoUI) => void;
}) {
  return (
    <div className="rounded-md bg-white border border-border-default wf-card flex flex-col gap-2 p-2">
      <button
        onClick={() => onDetalle(producto)}
        className="block w-full"
        aria-label={`Ver detalle de ${producto.nombre}`}
      >
        <PlaceholderImg className="h-28 w-full" />
      </button>
      <div className="flex items-end justify-between gap-2">
        <button onClick={() => onDetalle(producto)} className="text-left">
          <span className="block text-[11px] font-bold text-text-secondary">INKA ATHLETICS</span>
          <span className="block font-heading text-[17px] uppercase leading-tight text-text-primary">
            {producto.nombre}
          </span>
          <span className="block text-[12px] text-text-secondary">
            Calzado ligero, horma precisa
          </span>
          <span className="block text-[12px] text-text-secondary line-through">S/ {(producto.precio * 1.25).toFixed(2)}</span>
          <span className="block text-[14px] font-semibold text-text-primary">
            S/ {producto.precio}.00 <span className="ml-1 rounded-full bg-accent-volt-soft px-1.5 py-0.5 text-[10px] font-bold text-accent-volt-ink">-20%</span>
          </span>
          <span className="mt-1 inline-block rounded-full bg-accent-volt-soft px-2 py-0.5 text-[11px] font-bold text-accent-volt-ink">
            DISPONIBLE
          </span>
        </button>
        <button
          aria-label={`Elegir talla y color de ${producto.nombre}`}
          title="Elegir talla y color"
          onClick={() => onDetalle(producto)}
          className="w-9 h-9 shrink-0 wf-btn flex items-center justify-center bg-action-primary text-surface-ink hover:bg-action-primary-hover"
        >
          <PlusIcon size={16} />
        </button>
      </div>
    </div>
  );
}
