"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckIcon } from "../components/icons";
import { DevolucionForm } from "../components/forms/DevolucionForm";
import { container } from "@/infrastructure/di/container";
import { useChatStore } from "@/application/state/chatStore";
import type { DevolucionInput } from "@/domain/schemas/devolucion.schema";
import { isUnavailable, problemCode } from "@/domain/utils/httpError";

/** `/devolucion?pedidoId=...`: solicitud real de cambio/devolución (SPEC-21). */
export function DevolucionPage() {
  const router = useRouter();
  const params = useSearchParams();
  const pedidoId = params.get("pedidoId") ?? "";
  const [codigo, setCodigo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const conversacionId = useChatStore((s) => s.ultimaConversacionId);

  const pedido = useQuery({
    queryKey: ["pedido", pedidoId],
    queryFn: () => container.api.obtenerPedido(pedidoId),
    enabled: Boolean(pedidoId),
    retry: false,
  });

  const crear = useMutation({
    mutationFn: async (input: DevolucionInput & { evidenciaArchivo?: File }) => {
      const evidencia = input.evidenciaArchivo
        ? await container.api.subirEvidencia(input.evidenciaArchivo, conversacionId ?? undefined)
        : null;
      return container.api.crearDevolucion({
        pedidoId,
        tipo: input.tipo,
        motivo: input.motivo,
        descripcion: input.descripcion,
        items: [{ productoId: input.linea, cantidad: 1 }],
        evidencias: evidencia ? [{ tipo: evidencia.tipo, url: evidencia.url }] : [],
      });
    },
    onSuccess: (data) => {
      setError(null);
      setCodigo(data.devolucionId);
    },
    onError: (err) => {
      const code = problemCode(err);
      if (isUnavailable(err)) setError("El servicio de postventa no está disponible. Intenta de nuevo.");
      else if (code === "PLAZO_VENCIDO") setError("El plazo de 7 días para solicitar el cambio o devolución ya venció.");
      else if (code === "PEDIDO_NO_ENTREGADO") setError("Solo puedes solicitar un cambio o devolución de un pedido entregado.");
      else if (code === "EVIDENCIA_REQUERIDA") setError("Este motivo exige adjuntar al menos una evidencia.");
      else if (code === "DEVOLUCION_EN_CURSO") setError("Ya tienes una solicitud abierta para esas unidades.");
      else setError("No pudimos registrar tu solicitud. Revisa los datos e intenta de nuevo.");
    },
  });

  if (!pedidoId) {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-center">
        <h2 className="font-heading text-[20px]">Solicitar cambio o devolución</h2>
        <p className="text-[14px] text-text-secondary">Elige un pedido entregado desde tu historial.</p>
        <button onClick={() => router.push("/pedidos")} className="wf-btn w-full py-3 text-[12px] font-bold bg-action-primary text-surface-ink">
          IR A MIS PEDIDOS
        </button>
      </div>
    );
  }

  if (pedido.isLoading) {
    return <p className="p-6 text-[14px] text-text-secondary">Cargando pedido…</p>;
  }

  if (pedido.isError || !pedido.data) {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-center">
        <h2 className="font-heading text-[20px]">No encontré ese pedido</h2>
        <button onClick={() => router.push("/pedidos")} className="wf-btn w-full py-3 text-[12px] font-bold bg-action-primary text-surface-ink">
          VOLVER A MIS PEDIDOS
        </button>
      </div>
    );
  }

  if (pedido.data.estado !== "ENTREGADO") {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-center">
        <h2 className="font-heading text-[20px]">Pedido no entregado</h2>
        <p className="text-[14px] text-text-secondary">Solo puedes solicitar cambio o devolución después de la entrega.</p>
        <button onClick={() => router.push("/pedidos")} className="wf-btn w-full py-3 text-[12px] font-bold bg-action-primary text-surface-ink">
          VOLVER A MIS PEDIDOS
        </button>
      </div>
    );
  }

  if (codigo) {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-center">
        <div className="wf-check w-16 h-16 rounded-full flex items-center justify-center bg-success-background text-success-default"><CheckIcon size={24} /></div>
        <h2 className="font-heading text-[24px] leading-8">¡SOLICITUD ENVIADA!</h2>
        <p className="text-[14px] text-text-secondary">Código {codigo} · La evidencia quedó adjunta.</p>
        <div className="rounded-md bg-white border border-border-default w-full p-3 text-[12px] text-text-secondary">
          Puedes hacerle seguimiento por el chat o en Historial de pedidos → Reembolso/Cambio.
        </div>
        <button onClick={() => router.push("/pedidos/reembolso")} className="wf-btn w-full py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover">
          VER EN HISTORIAL
        </button>
      </div>
    );
  }

  const lineas = pedido.data.items.map((item) => ({
    productoId: item.productoId,
    label: `${item.descripcion} · ${item.sku}`,
  }));

  return (
    <div className="p-4 flex flex-col gap-3">
      <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">
        Solicitar devolución / cambio · {pedidoId}
      </p>
      {error ? <p className="text-[12px] text-error-default">{error}</p> : null}
      <DevolucionForm
        lineas={lineas}
        onOk={async (input) => { await crear.mutateAsync(input); }}
        onCancelar={() => router.push("/pedidos")}
      />
    </div>
  );
}
