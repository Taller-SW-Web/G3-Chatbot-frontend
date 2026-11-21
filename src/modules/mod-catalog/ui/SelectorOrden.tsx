"use client";

import {
  OPCIONES_ORDEN_CATALOGO,
  type OrdenCatalogo,
} from "@/modules/mod-catalog/domain/entities/OrdenCatalogo";

/** Selector de orden del catálogo (SPEC-06); aditivo a la home existente. */
export function SelectorOrden({
  value,
  onChange,
  disabled = false,
}: {
  value: OrdenCatalogo;
  onChange: (orden: OrdenCatalogo) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="catalogo-orden" className="text-[12px] font-semibold text-text-secondary">
        Ordenar por
      </label>
      <select
        id="catalogo-orden"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as OrdenCatalogo)}
        className="wf-input px-2 py-1.5 text-[12px] bg-white disabled:opacity-60"
      >
        {OPCIONES_ORDEN_CATALOGO.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>
    </div>
  );
}
