"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { XIcon } from "../icons";
import { AvailabilityBadge } from "../AvailabilityBadge";
import { ProductImage } from "../ProductImage";
import {
  availabilityMeta,
  findVariantSku,
  formatPrice,
  type AvailabilityState,
  type CatalogDetail,
} from "@/domain/entities/CatalogoUI";
import { sanitize } from "@/domain/utils/sanitize";

export type { CatalogDetail };

/** Consulta la disponibilidad real del SKU elegido (SPEC-10). */
export type ConsultarDisponibilidad = (sku: string) => Promise<AvailabilityState>;

const COLOR_HEX: Record<string, string> = {
  negro: "#1B1812",
  blanco: "#FFFFFF",
  gris: "#868E96",
  rojo: "#C0392B",
  azul: "#2471A3",
  verde: "#1E8449",
  amarillo: "#F1C40F",
  rosa: "#E91E8C",
  morado: "#7D3C98",
  naranja: "#E67E22",
  beige: "#D5C7A3",
  marron: "#7B4B2A",
};

/** Color de muestra: mapa conocido o tono estable derivado del nombre. */
export function colorSwatch(name: string): string {
  const key = name.trim().toLowerCase();
  const known = COLOR_HEX[key];
  if (known) return known;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 360;
  return `hsl(${hash}, 45%, 55%)`;
}

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Overlay accesible: role dialog, Escape para cerrar y foco atrapado. */
export function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const focusables = ref.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-surface-ink/60 fade-in p-5"
      onClick={onClose}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="pop-in w-full max-w-[320px] bg-white rounded-lg shadow-xl p-4 flex flex-col gap-3 max-h-[85%] overflow-y-auto no-scrollbar outline-none"
      >
        <div className="flex items-center justify-between">
          <p className="font-heading text-[15px] uppercase">{title}</p>
          <button
            aria-label="Cerrar detalle"
            onClick={onClose}
            className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse"
          >
            <XIcon size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Cuerpo de texto del detalle (SPEC-09). */
export function DetalleProducto({ p }: { p: CatalogDetail }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-heading text-[20px] uppercase">{sanitize(p.name)}</p>
      {p.brand && <p className="text-[13px] text-text-secondary">{sanitize(p.brand)}</p>}
      {p.shortDescription && (
        <p className="text-[13px] text-text-secondary">{sanitize(p.shortDescription)}</p>
      )}
      <p className="text-[14px] font-semibold text-text-secondary">{formatPrice(p)}</p>
    </div>
  );
}

/** Modal detalle con variantes reales y disponibilidad del SKU elegido. */
export function ProductDetailModal({
  p,
  onClose,
  onAdd,
  consultarDisponibilidad,
}: {
  p: CatalogDetail;
  onClose: () => void;
  onAdd: (sel: { sku: string | null; talla: string | null; color: string | null }) => void;
  /** Opcional: en el chat mock aún no hay SKU real que consultar. */
  consultarDisponibilidad?: ConsultarDisponibilidad;
}) {
  const [talla, setTalla] = useState<string | null>(
    p.tallas.length === 1 ? p.tallas[0] : null
  );
  const [color, setColor] = useState<string | null>(
    p.colores.length === 1 ? p.colores[0] : null
  );

  const skuVariante = p.hasVariants ? findVariantSku(p, talla, color) : null;
  const sku = p.hasVariants
    ? skuVariante
    : (p.singleSku ?? p.variants[0]?.sku ?? null);
  const haySku = sku != null;
  const varianteCompleta = p.hasVariants ? skuVariante != null : true;

  const disponibilidad = useQuery({
    queryKey: ["catalogo", "disponibilidad", sku],
    queryFn: () => consultarDisponibilidad!(sku as string),
    enabled: consultarDisponibilidad != null && haySku,
    retry: false,
  });

  const skuState: AvailabilityState | undefined = disponibilidad.data;
  const skuAgotado = skuState === "AGOTADO";
  const puedeAgregar = varianteCompleta && haySku && !skuAgotado;

  return (
    <ModalShell title="Detalle de producto" onClose={onClose}>
      <ProductImage
        src={p.image}
        alt={sanitize(p.name)}
        className="h-56 w-full"
        emojiClassName="text-[64px]"
      />
      <DetalleProducto p={p} />
      <AvailabilityBadge state={p.availability} className="w-fit" />
      {p.colores.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[14px]">Color: <span className="font-bold">{color ?? "Elige"}</span></p>
          <div className="flex gap-2" role="group" aria-label="Color">
            {p.colores.map((c) => (
              <button key={c} onClick={() => setColor(c)} aria-pressed={color === c}
                aria-label={`Color ${c}`} title={c} style={{ backgroundColor: colorSwatch(c) }}
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
      {consultarDisponibilidad && (
        <p data-testid="sku-disponibilidad" className="text-[13px] text-text-secondary">
          {!haySku
            ? "Elige talla y color para verificar la disponibilidad."
            : disponibilidad.isFetching
              ? "Verificando disponibilidad…"
              : disponibilidad.isError
                ? "No pudimos verificar la disponibilidad."
                : skuState
                  ? availabilityMeta(skuState).label
                  : ""}
        </p>
      )}
      <button onClick={() => onAdd({ sku, talla, color })} disabled={!puedeAgregar}
        className="wf-btn py-3.5 text-sm font-bold tracking-wide bg-action-primary text-surface-ink disabled:opacity-40 disabled:cursor-not-allowed">AGREGAR AL CARRITO</button>
    </ModalShell>
  );
}

export function XClose({ onClose }: { onClose: () => void }) {
  return <button aria-label="Cerrar" onClick={onClose}><XIcon size={20} /></button>;
}
