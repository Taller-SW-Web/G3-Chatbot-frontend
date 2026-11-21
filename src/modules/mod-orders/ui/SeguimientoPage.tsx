"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { TruckIcon } from "@/shared/ui/icons";
import { EstadoPedido } from "@/modules/mod-orders/ui/blocks/EstadoPedido";
import { container } from "@/shared/di/container";

const DATE_TIME = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const DATE_ONLY = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : DATE_TIME.format(date);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Por confirmar";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : DATE_ONLY.format(date);
}

/** `/seguimiento?pedidoId=...`: estado e hitos reales del despacho (SPEC-18). */
export function SeguimientoPage() {
  const router = useRouter();
  const params = useSearchParams();
  const pedidoId = params.get("pedidoId") ?? "";

  const seguimiento = useQuery({
    queryKey: ["seguimiento", pedidoId],
    queryFn: () => container.api.obtenerSeguimientoPedido(pedidoId),
    enabled: Boolean(pedidoId),
    retry: false,
    staleTime: 30_000,
  });

  if (!pedidoId) {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-center">
        <h2 className="font-heading text-[20px]">Seguimiento del pedido</h2>
        <p className="text-[14px] text-text-secondary">Elige un pedido desde tu historial.</p>
        <button
          onClick={() => router.push("/pedidos")}
          className="wf-btn w-full py-3 text-[12px] font-bold bg-action-primary text-surface-ink"
        >
          IR A MIS PEDIDOS
        </button>
      </div>
    );
  }

  if (seguimiento.isLoading) {
    return <p className="p-6 text-[14px] text-text-secondary">Consultando el seguimiento…</p>;
  }

  if (seguimiento.isError || !seguimiento.data) {
    return (
      <div className="p-4 flex flex-col gap-3">
        <div role="alert" className="rounded-md bg-white border border-border-default p-3 text-[13px] text-text-secondary">
          No pudimos consultar el seguimiento en este momento.
        </div>
        <button
          onClick={() => void seguimiento.refetch()}
          className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink"
        >
          REINTENTAR
        </button>
        <button
          onClick={() => router.push("/pedidos")}
          className="text-[14px] font-semibold underline text-text-secondary"
        >
          Volver al historial
        </button>
      </div>
    );
  }

  const data = seguimiento.data;
  const hitos = data.hitos.map((hito) => ({
    titulo: hito.titulo,
    fecha: formatDateTime(hito.fecha),
    done: hito.completado,
  }));

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="rounded-md bg-surface-ink text-text-inverse p-3 flex items-center gap-3">
        <span className="w-10 h-10 shrink-0 rounded-sm bg-surface-ink-soft border border-border-inverse flex items-center justify-center">
          <TruckIcon size={20} />
        </span>
        <div>
          <p className="font-heading text-[15px] uppercase">
            Pedido {data.pedidoId} · {data.estadoEtiqueta}
          </p>
          <p className="text-[12px] text-text-inverse-soft">
            {data.distrito ? `${data.distrito} · ` : ""}
            Entrega estimada {formatDate(data.fechaProgramada)}
          </p>
          {data.recibidoPor ? (
            <p className="text-[12px] text-text-inverse-soft">Recibido por {data.recibidoPor}</p>
          ) : null}
        </div>
      </div>

      {data.detalleDisponible === false ? (
        <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2 text-[13px] text-text-secondary">
          <p>{data.mensaje || "El detalle del envío no está disponible ahora."}</p>
          <button
            onClick={() => void seguimiento.refetch()}
            className="wf-chip w-fit px-3 py-1.5 text-[12px] font-semibold text-text-primary"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {hitos.length > 0 ? (
        <EstadoPedido hitos={hitos} />
      ) : (
        <p className="text-[14px] text-text-secondary rounded-md bg-white border border-border-default p-3">
          Todavía no hay hitos de despacho para este pedido.
        </p>
      )}

      <button
        disabled
        title="Próximamente"
        aria-label="Preguntar en el chat (próximamente)"
        className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover disabled:opacity-45 disabled:cursor-not-allowed"
      >
        PREGUNTAR EN EL CHAT
      </button>
      <button
        onClick={() => router.push("/pedidos")}
        className="text-[14px] font-semibold underline text-text-secondary"
      >
        Volver al historial
      </button>
    </div>
  );
}
