"use client";

import { useState } from "react";
import { PlusIcon } from "../icons";
import {
  formatPrice,
  type CatalogCardItem,
} from "@/domain/entities/CatalogoUI";
import { sanitize } from "@/domain/utils/sanitize";
import { AvailabilityBadge } from "../AvailabilityBadge";
import { ProductImage } from "../ProductImage";

export type { CatalogCardItem };

/** CARRUSEL_PRODUCTOS max 10 + Ver más, con datos de las herramientas. SPEC-06,09 */
export function CarruselProductos({
  titulo,
  productos,
  onAdd,
  onDetalle,
}: {
  titulo: string;
  productos: CatalogCardItem[];
  onAdd: (p: CatalogCardItem) => void;
  onDetalle: (p: CatalogCardItem) => void;
}) {
  const [verMas, setVerMas] = useState(false);
  const visibles = verMas ? productos.slice(0, 10) : productos.slice(0, 2);
  return (
    <div className="self-start w-full rounded-md bg-white border border-border-default p-2 flex flex-col gap-2 wf-card">
      <p className="px-1 text-[14px] font-semibold text-text-primary">{sanitize(titulo)}</p>
      <div className="grid grid-cols-2 gap-2">
        {visibles.map((p) => (
          <div key={p.product_id} className="relative rounded-md p-1.5 bg-white border border-border-default">
            {/* Una sola parada de tabulación para el detalle: imagen + textos. */}
            <button onClick={() => onDetalle(p)} className="w-full text-left flex flex-col gap-1">
              <ProductImage
                src={p.image}
                alt={sanitize(p.name)}
                className="h-24 w-full"
                emojiClassName="text-[28px]"
              />
              <span className="block font-heading text-[15px] uppercase leading-tight text-text-primary">{sanitize(p.name)}</span>
              <span className="block text-[13px] font-semibold text-text-secondary">{formatPrice(p)}</span>
            </button>
            <div className="flex items-center justify-between mt-1">
              <AvailabilityBadge state={p.availability} className="text-[11px] font-semibold" />
              <button aria-label={`Agregar ${sanitize(p.name)}`} onClick={() => onAdd(p)}
                disabled={p.availability === "AGOTADO"}
                className="w-8 h-8 wf-btn flex items-center justify-center bg-action-primary text-surface-ink disabled:opacity-40 disabled:cursor-not-allowed"><PlusIcon size={16} /></button>
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
