"use client";

import { CartDiscounts } from "@/modules/mod-cart/ui/CartDiscounts";
import { PriceTag } from "@/modules/mod-catalog/public";
import { parseAmount } from "@/modules/mod-catalog/public";
import { sanitize } from "@/shared/security/sanitize";
import type { DatosCarritoBloque } from "@/modules/mod-cart/domain/entities/DatosCarritoBloque";

/** CARRITO resumido + Ver carrito/Pagar. SPEC-11.
 * Pinta solo el bloque del servidor: precios y stock vienen del backend,
 * nunca del store local (el store solo guarda count/subtotal para el badge).
 */
export function BloqueCarrito({
  datos,
  onVerCarrito,
  onPagar,
}: {
  datos: DatosCarritoBloque;
  onVerCarrito: () => void;
  onPagar: () => void;
}) {
  const lineas = datos.lineas ?? [];
  const puedePagar = Boolean(
    lineas.length > 0 &&
      datos.promociones_ok !== false &&
      lineas.every((l) => l.disponible)
  );

  let motivoBloqueo = "";
  if (lineas.length === 0) {
    motivoBloqueo = "El carrito está vacío.";
  } else if (datos.promociones_ok === false) {
    motivoBloqueo = "No pudimos calcular promociones en este momento.";
  } else if (!lineas.every((l) => l.disponible)) {
    motivoBloqueo = "Hay productos sin stock disponible en el carrito.";
  }

  const total = datos.total ?? datos.subtotal;
  return (
    <div
      data-testid="bloque-carrito"
      className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2 wf-card"
    >
      <p className="font-heading text-[15px] uppercase">
        Carrito ({lineas.length})
      </p>
      {lineas.slice(0, 3).map((l) => (
        <div key={l.item_id} className="flex justify-between text-[13px] gap-2">
          <span className="truncate">
            {sanitize(l.nombre)} · {l.cantidad}
            {!l.disponible && (
              <span data-testid="linea-no-disponible" className="ml-1 text-error-default">
                — Ya no disponible
              </span>
            )}
          </span>
          <span className="font-semibold shrink-0"><PriceTag price={parseAmount(l.precio) === null ? null : l.precio * l.cantidad} /></span>
        </div>
      ))}
      <div className="flex justify-between gap-2 text-[13px]">
        <span className="text-text-secondary">Subtotal</span>
        <PriceTag price={parseAmount(datos.subtotal)} />
      </div>
      <CartDiscounts value={datos.descuentos} />
      {(datos.avisos ?? []).map((aviso, i) => (
        <p key={i} role="status" className="text-[12px] text-text-secondary">
          {sanitize(aviso)}
        </p>
      ))}
      <div className="flex justify-between text-[14px] border-t border-dashed border-border-default pt-2">
        <span className="text-text-secondary">Total</span>
        <span className="font-heading text-[18px]"><PriceTag price={parseAmount(total)} /></span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onVerCarrito}
          data-testid="btn-ver-carrito"
          className="wf-btn py-2.5 text-[11px] font-bold bg-white border border-border-default"
        >
          VER CARRITO
        </button>
        <button
          onClick={puedePagar ? onPagar : undefined}
          disabled={!puedePagar}
          aria-disabled={!puedePagar}
          aria-describedby={!puedePagar ? "motivo-bloqueo-pago-chat" : undefined}
          data-testid="btn-pagar"
          className="wf-btn py-2.5 text-[11px] font-bold bg-action-primary text-surface-ink disabled:opacity-50 disabled:cursor-not-allowed"
        >
          PAGAR
        </button>
      </div>
      {!puedePagar && motivoBloqueo && (
        <p id="motivo-bloqueo-pago-chat" role="status" className="text-[11px] text-text-secondary">
          {motivoBloqueo}
        </p>
      )}
    </div>
  );
}
