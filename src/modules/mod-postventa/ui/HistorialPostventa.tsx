"use client";

import { useQuery } from "@tanstack/react-query";
import { ListaDevoluciones } from "@/modules/mod-postventa/ui/blocks/ListaDevoluciones";
import { ListaReclamos } from "@/modules/mod-postventa/ui/blocks/ListaReclamos";
import { container } from "@/shared/di/container";

const DATE = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" });

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : DATE.format(date);
}

/** Pestaña Reembolso/Cambio del historial de pedidos (SPEC-22). */
export function HistorialDevoluciones() {
  const devoluciones = useQuery({
    queryKey: ["devoluciones", "historial"],
    queryFn: () => container.postventa.listarDevoluciones({ page: 1, pageSize: 20 }),
    retry: false,
  });

  return (
    <div className="flex flex-col gap-3">
      {devoluciones.isLoading ? <p className="text-[14px] text-text-secondary">Cargando solicitudes…</p> : null}
      {devoluciones.isError ? <p className="text-[14px] text-error-default">No puedo consultar tus devoluciones.</p> : null}
      {!devoluciones.isLoading && !devoluciones.isError && (devoluciones.data?.items.length ?? 0) === 0 ? (
        <p className="text-[14px] text-text-secondary">Aún no tienes solicitudes de cambio o devolución.</p>
      ) : null}
      <ListaDevoluciones items={(devoluciones.data?.items ?? []).map((d) => ({
        codigo: d.devolucionId,
        estado: d.estado,
        motivo: d.motivo,
        fecha: formatDate(d.fechaRegistro),
      }))} />
    </div>
  );
}

/** Pestaña Reclamos del historial de pedidos (SPEC-20). */
export function HistorialReclamos() {
  const reclamos = useQuery({
    queryKey: ["reclamos", "historial"],
    queryFn: () => container.postventa.listarReclamos({ page: 1, pageSize: 20 }),
    retry: false,
  });

  return (
    <div className="flex flex-col gap-3">
      {reclamos.isLoading ? <p className="text-[14px] text-text-secondary">Cargando reclamos…</p> : null}
      {reclamos.isError ? <p className="text-[14px] text-error-default">No puedo consultar tus reclamos.</p> : null}
      {!reclamos.isLoading && !reclamos.isError && (reclamos.data?.items.length ?? 0) === 0 ? (
        <p className="text-[14px] text-text-secondary">Aún no tienes reclamos registrados.</p>
      ) : null}
      <ListaReclamos items={(reclamos.data?.items ?? []).map((r) => ({
        codigo: r.codigoSeguimiento,
        estado: r.estado,
        motivo: r.motivo,
        plazo: formatDate(r.fechaLimiteSLA),
      }))} />
    </div>
  );
}
