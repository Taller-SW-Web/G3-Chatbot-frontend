import { StatusBadge } from "@/shared/ui/StatusBadge";
import { FileAlertIcon } from "@/shared/ui/icons";
import type {
  ConstanciaReclamoDatos,
  EstadoReclamoDatos,
} from "@/modules/mod-postventa/ui/blocks/tipos";

function variante(estado: string) {
  const normalizado = estado.toUpperCase();
  if (["RESUELTO", "RESUELTA", "ATENDIDO", "ATENDIDA"].includes(normalizado)) return "success" as const;
  if (["RECHAZADO", "RECHAZADA", "VENCIDO", "VENCIDA"].includes(normalizado)) return "error" as const;
  return "warning" as const;
}

function ResumenReclamo({ datos }: { datos: EstadoReclamoDatos | ConstanciaReclamoDatos }) {
  return (
    <>
      <div className="flex justify-between items-center gap-2">
        <p className="font-heading text-[15px] uppercase">Reclamo {datos.codigoSeguimiento}</p>
        <StatusBadge variant={variante(datos.estado)} icon={<FileAlertIcon size={16} />}>{datos.estadoEtiqueta}</StatusBadge>
      </div>
      <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Fecha</span><span>{datos.fecha}</span></div>
      {datos.pedidoId && <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Pedido</span><span>{datos.pedidoId}</span></div>}
      <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Tipo</span><span>{datos.tipo}</span></div>
      <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Motivo</span><span className="text-right">{datos.motivo}</span></div>
      {datos.fechaLimiteSLA && <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Plazo</span><span>{datos.fechaLimiteSLA}</span></div>}
    </>
  );
}

/** ESTADO_RECLAMO: estado, plazo y la respuesta textual de Ventas sin reformular. SPEC-20. */
export function EstadoReclamo({ datos }: { datos: EstadoReclamoDatos }) {
  return (
    <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2" data-testid="bloque-estado-reclamo">
      <ResumenReclamo datos={datos} />
      {datos.respuestaVisibleCliente && (
        <div className="rounded-sm bg-surface-cloud-subtle p-2.5 border-l-2 border-accent-signal">
          <p className="text-[12px] font-semibold text-text-secondary uppercase">Respuesta</p>
          <p className="text-[13px] text-text-primary whitespace-pre-line">{datos.respuestaVisibleCliente}</p>
        </div>
      )}
    </div>
  );
}

/** CONSTANCIA_RECLAMO: la produce la acción CONFIRMAR_RECLAMO. SPEC-19,20. */
export function ConstanciaReclamo({ datos }: { datos: ConstanciaReclamoDatos }) {
  return (
    <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2" data-testid="bloque-constancia-reclamo">
      <ResumenReclamo datos={datos} />
      {datos.mensaje && <p className="text-[13px] text-text-primary">{datos.mensaje}</p>}
      <p className="text-[12px] text-text-secondary">
        Guarda este código para consultar tu reclamo.
      </p>
    </div>
  );
}
