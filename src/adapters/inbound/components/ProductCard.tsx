"use client";

import { PlusIcon } from "./icons";
import type { CatalogCardItem } from "@/domain/entities/CatalogoUI";
import { sanitize } from "@/domain/utils/sanitize";

function BadgeDisponibilidad({ availability }: { availability: CatalogCardItem["availability"] }) {
  if (availability === "AGOTADO") {
    return (
      <span data-testid="badge-agotado" className="mt-1 inline-block rounded-full bg-surface-ink-soft px-2 py-0.5 text-[11px] font-bold text-text-secondary">
        AGOTADO
      </span>
    );
  }
  if (availability === "POCAS_UNIDADES") {
    return (
      <span data-testid="badge-pocas-unidades" className="mt-1 inline-block rounded-full bg-accent-signal-soft px-2 py-0.5 text-[11px] font-bold text-text-primary">
        ¡QUEDAN POCAS UNIDADES!
      </span>
    );
  }
  return (
    <span data-testid="badge-disponible" className="mt-1 inline-block rounded-full bg-accent-volt-soft px-2 py-0.5 text-[11px] font-bold text-accent-volt-ink">
      DISPONIBLE
    </span>
  );
}

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

/** Tarjeta de catálogo con datos de las herramientas (SPEC-09 Req. 1). */
export function ProductCard({
  producto,
  onDetalle,
}: {
  producto: CatalogCardItem;
  onDetalle: (p: CatalogCardItem) => void;
}) {
  const agotado = producto.availability === "AGOTADO";
  const nombre = sanitize(producto.name);

  return (
    <article
      data-testid="product-card"
      aria-label={nombre}
      className="rounded-md bg-white border border-border-default wf-card flex flex-col gap-2 p-2"
    >
      <button onClick={() => onDetalle(producto)} className="block w-full" aria-label={`Ver detalle de ${nombre}`}>
        <PlaceholderImg className="h-28 w-full" />
      </button>
      <div className="flex items-end justify-between gap-2">
        <button data-testid="btn-detalle" onClick={() => onDetalle(producto)} className="text-left">
          <span data-testid="product-marca" className="block text-[11px] font-bold text-text-secondary">{producto.brand ? sanitize(producto.brand).toUpperCase() : "CATÁLOGO"}</span>
          <span data-testid="product-nombre" className="block font-heading text-[17px] uppercase leading-tight text-text-primary">
            {nombre}
          </span>
          {producto.shortDescription && (
            <span className="block text-[12px] text-text-secondary">{sanitize(producto.shortDescription)}</span>
          )}
          <span data-testid="product-precio" className="block text-[14px] font-semibold text-text-primary">
            S/ {producto.price.toFixed(2)}
          </span>
          <BadgeDisponibilidad availability={producto.availability} />
        </button>
        <button
          data-testid="btn-agregar"
          aria-label={`Elegir talla y color de ${nombre}`}
          title={agotado ? "Agotado" : "Elegir talla y color"}
          disabled={agotado}
          onClick={() => onDetalle(producto)}
          className="w-9 h-9 shrink-0 wf-btn flex items-center justify-center bg-action-primary text-surface-ink hover:bg-action-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <PlusIcon size={16} />
        </button>
      </div>
    </article>
  );
}
