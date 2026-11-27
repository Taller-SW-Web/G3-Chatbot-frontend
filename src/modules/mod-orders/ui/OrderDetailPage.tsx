"use client";

import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon, TruckIcon, XIcon } from "@/shared/ui/icons";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { container } from "@/shared/di/container";
import { httpStatus, problemCode } from "@/shared/api/httpError";
import { resolverInfoAnulacion } from "@/modules/mod-orders/domain/utils/anulacionUtils";

const DATE_TIME = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : DATE_TIME.format(date);
}

function formatMoney(value: number, moneda: string | null | undefined): string {
  const prefijo = !moneda || moneda === "PEN" ? "S/" : moneda;
  return `${prefijo} ${value.toFixed(2)}`;
}

function varianteEstado(estado: string) {
  if (estado === "ENTREGADO") return "success" as const;
  if (estado === "ANULADO") return "error" as const;
  return "warning" as const;
}

/**
 * `/pedido?pedidoId=...`: detalle real con items, envío e historial (SPEC-17).
 * El CSAT es de `mod-postventa` y se inyecta como slot desde
 * `app/pedido/page.tsx`, solo si el pedido está ENTREGADO y sin calificar.
 */
export function OrderDetailPage({ csatSlot }: { csatSlot?: ReactNode }) {
  const router = useRouter();
  const params = useSearchParams();
  const pedidoId = params.get("pedidoId") ?? "";

  const pedido = useQuery({
    queryKey: ["pedido", pedidoId],
    queryFn: () => container.pedidos.obtenerPedido(pedidoId),
    enabled: Boolean(pedidoId),
    retry: false,
    staleTime: 30_000,
  });

  if (!pedidoId) {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-center">
        <h2 className="font-heading text-[20px]">Detalle del pedido</h2>
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

  if (pedido.isPending) {
    return (
      <div
        role="status"
        aria-label="Cargando detalle del pedido"
        className="p-4 flex flex-col gap-3 screen-enter"
      >
        <p className="sr-only">Cargando pedido…</p>
        <div className="rounded-md bg-white border border-border-default p-3.5 flex flex-col gap-2.5 wf-card">
          <div className="flex justify-between items-center">
            <div className="h-5 w-36 rounded shimmer" />
            <div className="h-6 w-24 rounded-full shimmer" />
          </div>
          <div className="flex justify-between items-center py-0.5">
            <div className="h-4 w-12 rounded shimmer" />
            <div className="h-4 w-20 rounded shimmer" />
          </div>
          <div className="flex justify-between items-center py-0.5">
            <div className="h-4 w-16 rounded shimmer" />
            <div className="h-4 w-28 rounded shimmer" />
          </div>
        </div>
        <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2 wf-card">
          <div className="h-4 w-24 rounded shimmer" />
          <div className="h-10 w-full rounded shimmer" />
        </div>
        <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2 wf-card">
          <div className="h-4 w-20 rounded shimmer" />
          <div className="h-16 w-full rounded shimmer" />
        </div>
      </div>
    );
  }

  if (pedido.isError || !pedido.data) {
    const noEncontrado =
      problemCode(pedido.error) === "RECURSO_NO_ENCONTRADO" || httpStatus(pedido.error) === 404;
    return (
      <div role="alert" className="p-5 flex flex-col items-center gap-3 text-center">
        <h2 className="font-heading text-[20px]">
          {noEncontrado ? "No encontré ese pedido" : "No pudimos consultar el pedido"}
        </h2>
        <p className="text-[14px] text-text-secondary">
          {noEncontrado
            ? "El pedido no existe o no pertenece a tu cuenta."
            : "Revisa tu conexión e intenta de nuevo."}
        </p>
        {!noEncontrado ? (
          <button
            onClick={() => void pedido.refetch()}
            className="wf-btn w-full py-3 text-[12px] font-bold bg-action-primary text-surface-ink"
          >
            REINTENTAR
          </button>
        ) : null}
        <button
          onClick={() => router.push("/pedidos")}
          className="text-[14px] font-semibold underline text-text-secondary"
        >
          Volver a mis pedidos
        </button>
      </div>
    );
  }

  const data = pedido.data;
  const infoAnulacion = resolverInfoAnulacion(data);
  const envio = data.envio;
  const tieneEnvio = Boolean(
    envio &&
      (envio.destinatario ||
        envio.distrito ||
        envio.direccion ||
        typeof envio.costo === "number" ||
        typeof envio.plazoEstimadoDias === "number")
  );

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="rounded-md bg-surface-ink text-text-inverse p-3 flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <p className="font-heading text-[15px] tracking-[0.06em] uppercase">
            Pedido {data.pedidoId}
          </p>
          <StatusBadge
            variant={varianteEstado(data.estado)}
            icon={data.estado === "ANULADO" ? <XIcon size={16} /> : <TruckIcon size={16} />}
          >
            {data.estado === "ANULADO" && infoAnulacion.esFaltaStock
              ? "Anulado por falta de stock"
              : data.estadoEtiqueta}
          </StatusBadge>
        </div>
        <div className="flex justify-between text-[13px] text-text-inverse-soft">
          <span>Total</span>
          <span className="font-bold text-text-inverse">{formatMoney(data.total, data.moneda)}</span>
        </div>
        <div className="flex justify-between text-[13px] text-text-inverse-soft">
          <span>Fecha</span>
          <span>{formatDateTime(data.fechaCreacion)}</span>
        </div>
      </div>

      {infoAnulacion.esAnulado && (
        <section
          role="region"
          aria-label="Información de anulación y reembolso"
          className="rounded-md bg-error-background/15 border border-error-default/30 p-3.5 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2 text-error-default">
            <XIcon size={20} className="shrink-0" />
            <h3 className="font-heading text-[14px] font-bold tracking-wide uppercase text-error-default">
              {infoAnulacion.tituloMotivo}
            </h3>
          </div>
          <p className="text-[13px] text-text-primary">
            {infoAnulacion.descripcionMotivo}
          </p>
          <div className="pt-2 border-t border-error-default/20 flex flex-col gap-0.5 text-[12px]">
            <span className="font-bold text-text-primary">Reembolso</span>
            <span className="text-text-secondary">{infoAnulacion.reembolsoTexto}</span>
          </div>
        </section>
      )}

      <section className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
        <h3 className="font-heading text-[14px] tracking-[0.06em] uppercase text-text-primary">Productos</h3>
        {data.items.length === 0 ? (
          <p className="text-[13px] text-text-secondary">Este pedido no tiene productos registrados.</p>
        ) : (
          data.items.map((item, index) => (
            <div key={`${item.sku}-${index}`} className="flex justify-between gap-3 text-[13px]">
              <div className="min-w-0">
                <p className="font-bold text-text-primary">{item.descripcion}</p>
                <p className="text-[12px] text-text-secondary">
                  Cant. {item.cantidad} · {item.sku}
                </p>
              </div>
              <span className="shrink-0">{formatMoney(item.precioUnitario, data.moneda)}</span>
            </div>
          ))
        )}
      </section>

      {tieneEnvio && envio ? (
        <section className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-1.5">
          <h3 className="font-heading text-[14px] tracking-[0.06em] uppercase text-text-primary">Envío</h3>
          {envio.destinatario ? (
            <div className="flex justify-between gap-3 text-[13px]">
              <span className="text-text-secondary">Destinatario</span>
              <span className="text-right">{envio.destinatario}</span>
            </div>
          ) : null}
          {envio.distrito ? (
            <div className="flex justify-between gap-3 text-[13px]">
              <span className="text-text-secondary">Distrito</span>
              <span className="text-right">{envio.distrito}</span>
            </div>
          ) : null}
          {envio.direccion ? (
            <div className="flex justify-between gap-3 text-[13px]">
              <span className="text-text-secondary">Dirección</span>
              <span className="text-right">{envio.direccion}</span>
            </div>
          ) : null}
          {typeof envio.costo === "number" ? (
            <div className="flex justify-between gap-3 text-[13px]">
              <span className="text-text-secondary">Costo de envío</span>
              <span className="text-right">{formatMoney(envio.costo, data.moneda)}</span>
            </div>
          ) : null}
          {typeof envio.plazoEstimadoDias === "number" ? (
            <div className="flex justify-between gap-3 text-[13px]">
              <span className="text-text-secondary">Plazo estimado</span>
              <span className="text-right">
                {envio.plazoEstimadoDias === 1 ? "1 día" : `${envio.plazoEstimadoDias} días`}
              </span>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
        <h3 className="font-heading text-[14px] tracking-[0.06em] uppercase text-text-primary">Historial</h3>
        {data.historial.length === 0 ? (
          <p className="text-[13px] text-text-secondary">Todavía no hay historial para este pedido.</p>
        ) : (
          <ol className="flex flex-col">
            {data.historial.map((hito, index) => {
              const esHitoAnulado = hito.estado === "ANULADO";
              const etiquetaHito =
                esHitoAnulado && infoAnulacion.esFaltaStock
                  ? "Anulado por falta de stock"
                  : hito.etiqueta;

              return (
                <li key={`${hito.estado}-${index}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center ${
                        esHitoAnulado
                          ? "bg-error-background border-error-default text-error-default"
                          : hito.completado
                          ? "bg-surface-ink border-surface-ink text-text-inverse"
                          : "bg-white border-border-default text-text-secondary"
                      }`}
                    >
                      {esHitoAnulado ? (
                        <XIcon size={16} />
                      ) : hito.completado ? (
                        <CheckIcon size={16} />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-border-default" />
                      )}
                    </span>
                    {index < data.historial.length - 1 ? <span className="w-[2px] flex-1 bg-border-default" /> : null}
                  </div>
                  <div className="pb-3 min-w-0">
                    <p className={`text-[14px] font-bold ${esHitoAnulado ? "text-error-default" : "text-text-primary"}`}>
                      {etiquetaHito}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-text-secondary">{hito.estado}</p>
                    <p className="text-[12px] text-text-secondary">{formatDateTime(hito.fecha)}</p>
                    {hito.motivo ? (
                      <p className="text-[12px] text-error-default font-medium mt-0.5">
                        Motivo: {hito.motivo === "STOCK_NO_DISPONIBLE" ? "Falta de stock" : hito.motivo}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {data.estado === "ENTREGADO" && !data.csatEnviado ? csatSlot ?? null : null}

      <button
        onClick={() => router.push("/pedidos")}
        className="text-[14px] font-semibold underline text-text-secondary"
      >
        Volver a mis pedidos
      </button>
    </div>
  );
}
