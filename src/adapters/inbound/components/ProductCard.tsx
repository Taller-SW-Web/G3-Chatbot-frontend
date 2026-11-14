"use client";

import { PlusIcon } from "./icons";
import {
  canAddCard,
  type CatalogCardItem,
} from "@/domain/entities/CatalogoUI";
import { PriceTag } from "./PriceTag";
import { sanitize } from "@/domain/utils/sanitize";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { ProductImage } from "./ProductImage";

/** Tarjeta de catálogo con datos de las herramientas (SPEC-09 Req. 1). */
export function ProductCard({
  producto,
  onDetalle,
  onAdd,
}: {
  producto: CatalogCardItem;
  onDetalle: (p: CatalogCardItem) => void;
  onAdd?: (p: CatalogCardItem) => void;
}) {
  const agotado = producto.availability === "AGOTADO";
  const nombre = sanitize(producto.name);

  return (
    <article
      data-testid="product-card"
      aria-label={nombre}
      className="relative rounded-md bg-white border border-border-default wf-card flex flex-col gap-2 p-2"
    >
      {/* Una sola parada de tabulación para el detalle: imagen + textos. */}
      <button
        data-testid="btn-detalle"
        onClick={() => onDetalle(producto)}
        className="w-full text-left flex flex-col gap-2"
      >
        <ProductImage src={producto.image} alt={nombre} className="h-28 w-full" />
        <span data-testid="product-marca" className="block text-[11px] font-bold text-text-secondary">
          {producto.brand ? sanitize(producto.brand).toUpperCase() : "CATÁLOGO"}
        </span>
        <span data-testid="product-nombre" className="block font-heading text-[17px] uppercase leading-tight text-text-primary">
          {nombre}
        </span>
        {producto.shortDescription && (
          <span className="block text-[12px] text-text-secondary">{sanitize(producto.shortDescription)}</span>
        )}
        <span data-testid="product-precio" className="block text-[14px] font-semibold text-text-primary">
          <PriceTag {...producto} />
        </span>
        <AvailabilityBadge state={producto.availability} missing={producto.missingData?.includes("availability")} className="self-start" />
      </button>
      <button
        data-testid="btn-agregar"
        aria-label={producto.hasVariants ? `Elegir talla y color de ${nombre}` : `Agregar ${nombre}`}
        title={agotado ? "Agotado" : producto.hasVariants ? "Elegir talla y color" : "Agregar al carrito"}
        disabled={!canAddCard(producto) || (!producto.hasVariants && !onAdd)}
        onClick={() => producto.hasVariants ? onDetalle(producto) : onAdd?.(producto)}
        className="absolute top-3 right-3 w-9 h-9 wf-btn flex items-center justify-center bg-action-primary text-surface-ink hover:bg-action-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <PlusIcon size={16} />
      </button>
    </article>
  );
}
