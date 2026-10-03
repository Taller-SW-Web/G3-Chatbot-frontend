"use client";

import { useState } from "react";
import { XIcon, CheckIcon } from "../icons";
import type { ProductoUI } from "@/domain/entities/ProductoUI";

export type ProductDetail = {
  nombre: string;
  categoria: string;
  talla: string;
  color: string;
  precio: number;
};

const COLORES = [
  { nombre: "Negro", hex: "#1B1812" },
  { nombre: "Blanco", hex: "#FFFFFF" },
  { nombre: "Gris", hex: "#868E96" },
];

function descripcionPara(nombre: string, categoria: string): string {
  const n = nombre.toLowerCase();
  if (n.includes("runner")) return "Amortiguación ligera para tus rutas diarias.";
  if (n.includes("urban")) return "Pisada estable y diseño versátil para todo el día.";
  if (n.includes("trail")) return "Agarre firme en tierra y piedra.";
  if (n.includes("court")) return "Clásica y cómoda para el uso diario.";
  return `${categoria}. Calzado verificado.`;
}

/** DETALLE_PRODUCTO variantes + SKU. SPEC-09 */
export function DetalleProducto({ p }: { p: ProductDetail & { sku?: string } }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-heading text-[20px] uppercase">{p.nombre}</p>
      <p className="text-[13px] text-text-secondary">{p.categoria}</p>
      <p className="text-[13px] text-text-secondary">{descripcionPara(p.nombre, p.categoria)}</p>
      <p className="text-[14px] font-semibold text-text-secondary">S/ {p.precio}.00</p>
    </div>
  );
}

/** Modal detalle (talla/color/stock) reutilizado en home/chat/carrito. */
export function ProductDetailModal({
  p, onClose, onAdd,
}: {
  p: ProductDetail;
  onClose: () => void;
  onAdd: (p: ProductDetail & { sku?: string }) => void;
}) {
  const [talla, setTalla] = useState(p.talla);
  const [color, setColor] = useState(
    COLORES.some((c) => c.nombre === p.color) ? p.color : COLORES[0].nombre
  );
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-surface-ink/60 fade-in p-5" onClick={onClose}>
      <div className="pop-in w-full max-w-[320px] bg-white rounded-lg shadow-xl p-4 flex flex-col gap-3 max-h-[85%] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-heading text-[15px] uppercase">Detalle de producto</p>
          <button aria-label="Cerrar detalle" onClick={onClose}
            className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse"><XIcon size={20} /></button>
        </div>
        <span className="h-56 w-full rounded-md flex items-center justify-center text-[64px]"
          style={{ background: "linear-gradient(135deg, var(--color-surface-ink-soft), var(--color-accent-signal-soft), var(--color-surface-ink))" }} role="img" aria-label={p.nombre}>👟</span>
        <DetalleProducto p={{ ...p, talla, color }} />
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-accent-volt-soft px-2 py-0.5 text-[11px] font-bold text-accent-volt-ink"><CheckIcon size={16} />DISPONIBLE</span>
        <div className="flex flex-col gap-1.5">
          <p className="text-[14px]">Color: <span className="font-bold">{color}</span></p>
          <div className="flex gap-2" role="group" aria-label="Color">
            {COLORES.map((c) => (
              <button key={c.nombre} onClick={() => setColor(c.nombre)} aria-pressed={color === c.nombre}
                aria-label={`Color ${c.nombre}`} title={c.nombre} style={{ backgroundColor: c.hex }}
                className={`w-9 h-9 rounded-full border border-border-default ${color === c.nombre ? "ring-2 ring-offset-2 ring-surface-ink" : ""}`} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-[14px] font-bold">Talla: <span className="font-semibold text-text-secondary">{talla.replace("Talla ", "")}</span></p>
          <div className="flex gap-2" role="group" aria-label="Talla">
            {["Talla 40", "Talla 41", "Talla 42", "Talla 43"].map((t) => (
              <button key={t} onClick={() => setTalla(t)} aria-pressed={talla === t}
                className={`wf-chip px-4 py-2 text-[14px] font-bold ${talla === t ? "bg-surface-ink text-text-inverse border-surface-ink" : "text-text-primary"}`}>
                {t.replace("Talla ", "")}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => onAdd({ ...p, talla, color })}
          className="wf-btn py-3.5 text-sm font-bold tracking-wide bg-action-primary text-surface-ink">AGREGAR AL CARRITO</button>
      </div>
    </div>
  );
}

export type { ProductoUI };
export function XClose({ onClose }: { onClose: () => void }) {
  return <button aria-label="Cerrar" onClick={onClose}><XIcon size={20} /></button>;
}
