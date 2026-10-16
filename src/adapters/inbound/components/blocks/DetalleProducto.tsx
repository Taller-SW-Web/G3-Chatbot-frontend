"use client";

import { useState } from "react";
import { XIcon, CheckIcon } from "../icons";
import {
  findVariantSku,
  type CatalogDetail,
} from "@/domain/entities/CatalogoUI";
import { sanitize } from "@/domain/utils/sanitize";

export type { CatalogDetail };

const COLOR_HEX: Record<string, string> = {
  Negro: "#1B1812",
  Blanco: "#FFFFFF",
  Gris: "#868E96",
  Rojo: "#C0392B",
  Azul: "#2471A3",
};

/** DETALLE_PRODUCTO con variantes y disponibilidad reales. SPEC-09 */
export function DetalleProducto({ p }: { p: CatalogDetail }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-heading text-[20px] uppercase">{sanitize(p.name)}</p>
      {p.brand && <p className="text-[13px] text-text-secondary">{sanitize(p.brand)}</p>}
      <p className="text-[13px] text-text-secondary">{sanitize(p.description)}</p>
      <p className="text-[14px] font-semibold text-text-secondary">S/ {p.price.toFixed(2)}</p>
    </div>
  );
}

/** Modal detalle con variantes reales reutilizado en home/chat. */
export function ProductDetailModal({
  p, onClose, onAdd,
}: {
  p: CatalogDetail;
  onClose: () => void;
  onAdd: (sel: { sku: string | null; talla: string | null; color: string | null }) => void;
}) {
  const [talla, setTalla] = useState<string | null>(
    p.tallas.length === 1 ? p.tallas[0] : null
  );
  const [color, setColor] = useState<string | null>(
    p.colores.length === 1 ? p.colores[0] : null
  );
  const sku = findVariantSku(p, talla, color);
  const completo = p.hasVariants ? sku != null : true;
  const unico = !p.hasVariants && p.variants.length === 1 ? p.variants[0].sku : sku;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-surface-ink/60 fade-in p-5" onClick={onClose}>
      <div className="pop-in w-full max-w-[320px] bg-white rounded-lg shadow-xl p-4 flex flex-col gap-3 max-h-[85%] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-heading text-[15px] uppercase">Detalle de producto</p>
          <button aria-label="Cerrar detalle" onClick={onClose}
            className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse"><XIcon size={20} /></button>
        </div>
        <span className="h-56 w-full rounded-md flex items-center justify-center text-[64px]"
          style={{ background: "linear-gradient(135deg, var(--color-surface-ink-soft), var(--color-accent-signal-soft), var(--color-surface-ink))" }} role="img" aria-label={sanitize(p.name)}>👟</span>
        <DetalleProducto p={p} />
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-accent-volt-soft px-2 py-0.5 text-[11px] font-bold text-accent-volt-ink"><CheckIcon size={16} />{p.availability === "AGOTADO" ? "AGOTADO" : p.availability === "DISPONIBLE" ? "DISPONIBLE" : "STOCK LIMITADO"}</span>
        {p.colores.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[14px]">Color: <span className="font-bold">{color ?? "Elige"}</span></p>
            <div className="flex gap-2" role="group" aria-label="Color">
              {p.colores.map((c) => (
                <button key={c} onClick={() => setColor(c)} aria-pressed={color === c}
                  aria-label={`Color ${c}`} title={c} style={{ backgroundColor: COLOR_HEX[c] ?? "#868E96" }}
                  className={`w-9 h-9 rounded-full border border-border-default ${color === c ? "ring-2 ring-offset-2 ring-surface-ink" : ""}`} />
              ))}
            </div>
          </div>
        )}
        {p.tallas.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[14px] font-bold">Talla: <span className="font-semibold text-text-secondary">{talla ?? "Elige"}</span></p>
            <div className="flex gap-2" role="group" aria-label="Talla">
              {p.tallas.map((t) => (
                <button key={t} onClick={() => setTalla(t)} aria-pressed={talla === t}
                  className={`wf-chip px-4 py-2 text-[14px] font-bold ${talla === t ? "bg-surface-ink text-text-inverse border-surface-ink" : "text-text-primary"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
        <button onClick={() => onAdd({ sku: unico, talla, color })} disabled={!completo}
          className="wf-btn py-3.5 text-sm font-bold tracking-wide bg-action-primary text-surface-ink disabled:opacity-40 disabled:cursor-not-allowed">AGREGAR AL CARRITO</button>
      </div>
    </div>
  );
}

export function XClose({ onClose }: { onClose: () => void }) {
  return <button aria-label="Cerrar" onClick={onClose}><XIcon size={20} /></button>;
}
