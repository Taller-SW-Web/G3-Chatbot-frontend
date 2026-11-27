"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RefreshIcon, FileAlertIcon } from "@/shared/ui/icons";
import { ListaDevoluciones } from "@/modules/mod-postventa/ui/blocks/ListaDevoluciones";
import { ListaReclamos } from "@/modules/mod-postventa/ui/blocks/ListaReclamos";
import { container } from "@/shared/di/container";

const DATE = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" });

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : DATE.format(date);
}

const ETIQUETAS_ESTADO: Record<string, string> = {
  REGISTRADO: "Registrado",
  REGISTRADA: "Registrada",
  EN_REVISION: "En revisión",
  PENDIENTE: "Pendiente",
  APROBADO: "Aprobado",
  APROBADA: "Aprobada",
  RECHAZADO: "Rechazado",
  RECHAZADA: "Rechazada",
  RESUELTO: "Resuelto",
  RESUELTA: "Resuelta",
  ATENDIDO: "Atendido",
  ATENDIDA: "Atendida",
  EN_PROCESO: "En proceso",
  REEMBOLSADO: "Reembolsado",
  REEMBOLSADA: "Reembolsada",
  ANULADO: "Anulado",
  ANULADA: "Anulada",
  SOLICITADA: "Solicitada",
  SOLICITADO: "Solicitado",
  PENDIENTE_ENVIO: "Pendiente de envío",
  RECIBIDO: "Recibido",
  FINALIZADO: "Finalizado",
};

export function humanizarEstado(estado: string): string {
  if (!estado) return "—";
  const norm = estado.trim().toUpperCase();
  return ETIQUETAS_ESTADO[norm] ?? (estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase());
}

/** Pestaña Reembolso/Cambio del historial de pedidos (SPEC-22). */
export function HistorialDevoluciones() {
  const router = useRouter();
  const devoluciones = useQuery({
    queryKey: ["devoluciones", "historial"],
    queryFn: () => container.postventa.listarDevoluciones({ page: 1, pageSize: 20 }),
    retry: false,
  });

  return (
    <div className="flex flex-col gap-3">
      {devoluciones.isLoading && (
        <div role="status" aria-label="Cargando solicitudes" className="flex flex-col gap-3 screen-enter">
          <p className="sr-only">Cargando solicitudes…</p>
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-md bg-white border border-border-default p-3.5 flex flex-col gap-2.5 wf-card">
              <div className="flex justify-between items-center">
                <div className="h-4 w-28 rounded shimmer" />
                <div className="h-5 w-20 rounded-full shimmer" />
              </div>
              <div className="h-3.5 w-40 rounded shimmer" />
              <div className="h-3 w-24 rounded shimmer" />
            </div>
          ))}
        </div>
      )}
      {devoluciones.isError && (
        <p className="text-[14px] text-error-default bg-white p-4 rounded-md border border-border-default text-center">
          No puedo consultar tus devoluciones en este momento.
        </p>
      )}
      {!devoluciones.isLoading && !devoluciones.isError && (devoluciones.data?.items.length ?? 0) === 0 && (
        <div className="py-10 px-4 flex flex-col items-center justify-center text-center gap-3.5 bg-white rounded-md border border-border-default screen-enter my-1">
          <div className="w-14 h-14 rounded-full bg-surface-cloud flex items-center justify-center text-text-secondary border border-border-default">
            <RefreshIcon size={24} />
          </div>
          <div className="flex flex-col gap-1 items-center max-w-[280px]">
            <h3 className="font-heading text-[16px] tracking-wide text-text-primary uppercase">
              SIN SOLICITUDES DE CAMBIO O DEVOLUCIÓN
            </h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Aún no tienes solicitudes de cambio o devolución. Si necesitas gestionar un cambio de talla o consultar garantías, conversa con nuestro asistente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="wf-btn px-6 py-2.5 text-[12px] font-bold bg-action-primary text-surface-ink hover:bg-action-primary-hover active:scale-95 transition-all shadow-sm rounded-sm tracking-wide uppercase mt-1 inline-flex items-center gap-2"
          >
            CONSULTAR CON EL ASISTENTE
          </button>
        </div>
      )}
      <ListaDevoluciones devoluciones={(devoluciones.data?.items ?? []).map((d) => ({
        devolucionId: d.devolucionId,
        pedidoId: d.pedidoId,
        tipo: d.tipo,
        estado: d.estado,
        estadoEtiqueta: humanizarEstado(d.estado),
        motivo: d.motivo,
        fecha: formatDate(d.fechaRegistro),
        estadoReembolso: d.estadoReembolso ?? undefined,
      }))} />
    </div>
  );
}

/** Pestaña Reclamos del historial de pedidos (SPEC-20). */
export function HistorialReclamos() {
  const router = useRouter();
  const reclamos = useQuery({
    queryKey: ["reclamos", "historial"],
    queryFn: () => container.postventa.listarReclamos({ page: 1, pageSize: 20 }),
    retry: false,
  });

  return (
    <div className="flex flex-col gap-3">
      {reclamos.isLoading && (
        <div role="status" aria-label="Cargando reclamos" className="flex flex-col gap-3 screen-enter">
          <p className="sr-only">Cargando reclamos…</p>
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-md bg-white border border-border-default p-3.5 flex flex-col gap-2.5 wf-card">
              <div className="flex justify-between items-center">
                <div className="h-4 w-28 rounded shimmer" />
                <div className="h-5 w-20 rounded-full shimmer" />
              </div>
              <div className="h-3.5 w-48 rounded shimmer" />
              <div className="h-3 w-24 rounded shimmer" />
            </div>
          ))}
        </div>
      )}
      {reclamos.isError && (
        <p className="text-[14px] text-error-default bg-white p-4 rounded-md border border-border-default text-center">
          No puedo consultar tus reclamos en este momento.
        </p>
      )}
      {!reclamos.isLoading && !reclamos.isError && (reclamos.data?.items.length ?? 0) === 0 && (
        <div className="py-10 px-4 flex flex-col items-center justify-center text-center gap-3.5 bg-white rounded-md border border-border-default screen-enter my-1">
          <div className="w-14 h-14 rounded-full bg-surface-cloud flex items-center justify-center text-text-secondary border border-border-default">
            <FileAlertIcon size={24} />
          </div>
          <div className="flex flex-col gap-1 items-center max-w-[280px]">
            <h3 className="font-heading text-[16px] tracking-wide text-text-primary uppercase">
              NO TIENES RECLAMOS REGISTRADOS
            </h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Aún no tienes reclamos registrados. Si tuviste algún problema con un pedido o producto, nuestro asistente te ayudará a solucionarlo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="wf-btn px-6 py-2.5 text-[12px] font-bold bg-action-primary text-surface-ink hover:bg-action-primary-hover active:scale-95 transition-all shadow-sm rounded-sm tracking-wide uppercase mt-1 inline-flex items-center gap-2"
          >
            CONSULTAR CON EL ASISTENTE
          </button>
        </div>
      )}
      <ListaReclamos reclamos={(reclamos.data?.items ?? []).map((r) => ({
        codigoSeguimiento: r.codigoSeguimiento,
        fecha: formatDate(r.fechaRegistro),
        pedidoId: r.pedidoId,
        tipo: r.tipo,
        motivo: r.motivo,
        estado: r.estado,
        estadoEtiqueta: humanizarEstado(r.estado),
        fechaLimiteSLA: r.fechaLimiteSLA ? formatDate(r.fechaLimiteSLA) : null,
      }))} />
    </div>
  );
}
