import { StatusBadge } from "@/shared/ui/StatusBadge";
import { RefreshIcon, CheckIcon } from "@/shared/ui/icons";
import type {
  ConstanciaDevolucionDatos,
  EstadoDevolucionDatos,
  ReembolsoBloque,
} from "@/modules/mod-postventa/ui/blocks/tipos";

function variante(estado: string) {
  const normalizado = estado.toUpperCase();
  if (["APROBADO", "APROBADA", "REEMBOLSADO", "REEMBOLSADA", "RESUELTO", "RESUELTA"].includes(normalizado)) return "success" as const;
  if (["RECHAZADO", "RECHAZADA", "ANULADO", "ANULADA"].includes(normalizado)) return "error" as const;
  return "warning" as const;
}

/** Importe tal como lo entrega Ventas; sin monto no se pinta nada. */
function importe(reembolso: ReembolsoBloque): string | null {
  if (reembolso.monto === undefined || reembolso.monto === null || reembolso.monto === "") return null;
  const numero = typeof reembolso.monto === "number" ? reembolso.monto : Number(reembolso.monto);
  if (!Number.isFinite(numero)) return null;
  const moneda = reembolso.moneda && reembolso.moneda !== "PEN" ? reembolso.moneda : "S/";
  return `${moneda} ${numero.toFixed(2)}`;
}

function ResumenDevolucion({ datos }: { datos: EstadoDevolucionDatos | ConstanciaDevolucionDatos }) {
  return (
    <>
      <div className="flex justify-between items-center gap-2">
        <p className="font-heading text-[15px] uppercase">Solicitud {datos.devolucionId}</p>
        <StatusBadge variant={variante(datos.estado)} icon={variante(datos.estado) === "success" ? <CheckIcon size={16} /> : <RefreshIcon size={16} />}>
          {datos.estadoEtiqueta}
        </StatusBadge>
      </div>
      <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Pedido</span><span>{datos.pedidoId}</span></div>
      <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Fecha</span><span>{datos.fecha}</span></div>
      <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Tipo</span><span>{datos.tipo}</span></div>
      <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Motivo</span><span className="text-right">{datos.motivo}</span></div>
      {datos.estadoReembolso && <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Reembolso</span><span>{datos.estadoReembolso}</span></div>}
    </>
  );
}

/** ESTADO_DEVOLUCION: resolución y reembolso solo si Ventas los informó. SPEC-22. */
export function EstadoDevolucion({ datos }: { datos: EstadoDevolucionDatos }) {
  const resolucion = datos.resolucion;
  const reembolso = resolucion?.reembolso;
  const monto = reembolso ? importe(reembolso) : null;
  const enProceso =
    !reembolso &&
    datos.tipo.toUpperCase() === "DEVOLUCION_DINERO" &&
    ["APROBADO", "APROBADA"].includes(datos.estado.toUpperCase());
  return (
    <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2" data-testid="bloque-estado-devolucion">
      <ResumenDevolucion datos={datos} />
      {enProceso && <p className="text-[13px] font-semibold text-text-primary">Tu reembolso está en proceso.</p>}
      {resolucion?.fundamento && (
        <div className="rounded-sm bg-surface-cloud-subtle p-2.5 border-l-2 border-accent-signal">
          <p className="text-[12px] font-semibold text-text-secondary uppercase">Resolución</p>
          <p className="text-[13px] text-text-primary whitespace-pre-line">{resolucion.fundamento}</p>
        </div>
      )}
      {reembolso && (
        <div className="rounded-sm border border-border-default p-2.5 flex flex-col gap-1" data-testid="bloque-reembolso">
          <p className="text-[12px] font-semibold text-text-secondary uppercase">Reembolso</p>
          {reembolso.reembolsoId && <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Código</span><span>{reembolso.reembolsoId}</span></div>}
          {reembolso.estado && <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Estado</span><span>{reembolso.estado}</span></div>}
          {monto && <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Monto</span><span className="font-bold">{monto}</span></div>}
          {reembolso.fechaEjecucion && <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Fecha</span><span>{reembolso.fechaEjecucion}</span></div>}
        </div>
      )}
    </div>
  );
}

/** CONSTANCIA_DEVOLUCION: la produce la acción CONFIRMAR_DEVOLUCION. SPEC-21,22. */
export function ConstanciaDevolucion({ datos }: { datos: ConstanciaDevolucionDatos }) {
  return (
    <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2" data-testid="bloque-constancia-devolucion">
      <ResumenDevolucion datos={datos} />
      <p className="text-[12px] text-text-secondary">
        Guarda este código para consultar tu solicitud.
      </p>
    </div>
  );
}
