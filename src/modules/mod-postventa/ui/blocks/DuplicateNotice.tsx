"use client";

import { FileAlertIcon } from "@/shared/ui/icons";
import type { SolicitudDuplicada } from "@/modules/mod-postventa/domain/utils/duplicados";

/**
 * Aviso de solicitud abierta (SPEC-19 Req. 3, SPEC-21 Req. 5).
 *
 * Muestra el código existente y permite registrar igual reenviando la solicitud
 * con `forzar: true`, sin perder lo que el cliente ya escribió.
 */
export function DuplicateNotice({
  duplicado,
  onForzar,
  cargando = false,
}: {
  duplicado: SolicitudDuplicada;
  onForzar: () => void;
  cargando?: boolean;
}) {
  return (
    <div
      role="alert"
      data-testid="postventa-duplicado"
      className="rounded-md bg-warning-background border border-warning-default p-3 flex flex-col gap-2 text-[13px]"
    >
      <div className="flex items-center gap-2 font-bold text-warning-default">
        <FileAlertIcon size={20} />
        <span>Ya tienes una solicitud abierta para este pedido</span>
      </div>
      {duplicado.codigo ? (
        <p>
          Código existente: <span className="font-bold">{duplicado.codigo}</span>
        </p>
      ) : (
        <p>{duplicado.mensaje ?? "El backend reportó una solicitud abierta para este pedido."}</p>
      )}
      <button
        type="button"
        onClick={onForzar}
        disabled={cargando}
        className="wf-btn self-start px-4 py-2 text-[12px] font-bold bg-white border border-border-default disabled:opacity-60"
      >
        {cargando ? "REGISTRANDO…" : "REGISTRAR IGUAL"}
      </button>
    </div>
  );
}
