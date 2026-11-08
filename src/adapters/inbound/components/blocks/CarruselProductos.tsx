"use client";

import { useState } from "react";
import { PlusIcon } from "../icons";
import {
  type CatalogCardItem,
} from "@/domain/entities/CatalogoUI";
import { PriceTag } from "../PriceTag";
import { sanitize } from "@/domain/utils/sanitize";
import { AvailabilityBadge } from "../AvailabilityBadge";
import { ProductImage } from "../ProductImage";

export type { CatalogCardItem };

/** CARRUSEL_PRODUCTOS max 10 + Ver más, con datos de las herramientas. SPEC-06,09 */
export function CarruselProductos({
  titulo,
  productos,
  variant,
  onAdd,
  onDetalle,
}: {
  titulo?: string;
  variant?: "recomendacion" | "cross_sell" | "ofertas";
  productos: CatalogCardItem[];
  onAdd: (p: CatalogCardItem) => void;
  onDetalle: (p: CatalogCardItem) => void;
}) {
  const [verMas, setVerMas] = useState(false);
  const crossSell = variant === "cross_sell";
  const visibles = crossSell ? productos.slice(0, 3) : variant === "recomendacion" ? productos.slice(0, 5) : verMas ? productos.slice(0, 10) : productos.slice(0, 2);
  return (
    <div className="self-start w-full rounded-md bg-white border border-border-default p-2 flex flex-col gap-2 wf-card">
      {titulo && <p className="px-1 text-[14px] font-semibold text-text-primary">{sanitize(titulo)}</p>}
      {productos.length === 0 && <p role="status" className="text-[13px] text-text-secondary">No hay productos para mostrar.</p>}
      <div role="group" aria-label={titulo || "Productos"} className={crossSell ? "flex gap-2 overflow-x-auto pb-1" : "grid grid-cols-2 gap-2"}>
        {visibles.map((p) => (
          <div key={p.product_id} className={`relative min-w-0 rounded-md p-1.5 bg-white border border-border-default ${crossSell ? "w-40 shrink-0" : ""}`}>
            {/* Una sola parada de tabulación para el detalle: imagen + textos. */}
            <button aria-label={`Ver detalle de ${sanitize(p.name)}`} onClick={() => onDetalle(p)} className="w-full text-left flex flex-col gap-1">
              <ProductImage
                src={p.image}
                alt={sanitize(p.name)}
                className="h-24 w-full"
                emojiClassName="text-[28px]"
              />
              {p.brand && <span className="text-[12px] text-text-secondary">{sanitize(p.brand)}</span>}
              <span className="block font-heading text-[15px] uppercase leading-tight text-text-primary">{sanitize(p.name)}</span>
              <span className="block text-[13px] font-semibold text-text-secondary"><PriceTag {...p} /></span>
            </button>
            {p.recommendationReason && <p className="mt-1 text-[12px] text-text-secondary break-words">{sanitize(p.recommendationReason)}</p>}
            <div className="flex items-center justify-between mt-1">
              <AvailabilityBadge state={p.availability} className="text-[11px] font-semibold" />
              <button aria-label={`Agregar ${sanitize(p.name)}`} onClick={() => onAdd(p)}
                disabled={p.availability === "AGOTADO" || p.price === null}
                className="w-8 h-8 shrink-0 wf-btn flex items-center justify-center bg-action-primary text-surface-ink disabled:opacity-40 disabled:cursor-not-allowed"><PlusIcon size={16} /></button>
            </div>
          </div>
        ))}
      </div>
      {!crossSell && variant !== "recomendacion" && productos.length > 2 && (
        <button onClick={() => setVerMas((v) => !v)} className="min-h-11 text-[12px] font-semibold underline text-text-secondary">
          {verMas ? "Ver menos" : "Ver más productos"}
        </button>
      )}
    </div>
  );
}
