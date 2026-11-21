"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckIcon } from "@/shared/ui/icons";
import { ReclamoForm } from "@/modules/mod-postventa/ui/forms/ReclamoForm";
import { container } from "@/shared/di/container";
import type { ReclamoInput } from "@/modules/mod-postventa/domain/schemas/reclamo.schema";
import { isUnavailable, problemCode } from "@/shared/api/httpError";

/** `/reclamo?pedidoId=...`: registro real en el Libro de Reclamaciones (SPEC-19). */
export function ReclamoPage() {
  const router = useRouter();
  const params = useSearchParams();
  const pedidoId = params.get("pedidoId") ?? "";
  const [codigo, setCodigo] = useState<string | null>(null);
  const [plazo, setPlazo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const perfil = useQuery({
    queryKey: ["perfil"],
    queryFn: () => container.api.fetchProfile(),
    retry: false,
  });

  const crear = useMutation({
    mutationFn: (input: ReclamoInput) =>
      container.api.crearReclamo({
        pedidoId: input.pedidoId,
        tipo: input.tipo,
        motivo: input.motivo,
        detalle: input.descripcion + (input.solucion ? `\n\nSolución esperada: ${input.solucion}` : ""),
        consumidor: {
          nombreCompleto: perfil.data?.nombreCompleto ?? "",
          documento: input.documento,
          email: perfil.data?.correo ?? "",
          telefono: input.telefono,
        },
        solucionEsperada: input.solucion,
      }),
    onSuccess: (data) => {
      setError(null);
      setCodigo(data.codigoSeguimiento);
      setPlazo(data.fechaLimiteSLA ? new Date(data.fechaLimiteSLA).toLocaleDateString("es-PE") : null);
    },
    onError: (err) => {
      const code = problemCode(err);
      if (isUnavailable(err)) setError("El servicio de reclamos no está disponible. Intenta de nuevo.");
      else if (code === "RECURSO_NO_ENCONTRADO") setError("No encontré ese pedido en tu cuenta.");
      else if (code === "DATOS_INVALIDOS" || code === "VALIDACION") setError("Revisa los datos del formulario e intenta de nuevo.");
      else setError("No pudimos registrar tu reclamo. Intenta de nuevo en unos minutos.");
    },
  });

  if (!pedidoId) {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-center">
        <h2 className="font-heading text-[20px]">Registrar un reclamo</h2>
        <p className="text-[14px] text-text-secondary">Elige el pedido sobre el que quieres reclamar.</p>
        <button onClick={() => router.push("/pedidos")} className="wf-btn w-full py-3 text-[12px] font-bold bg-action-primary text-surface-ink">
          IR A MIS PEDIDOS
        </button>
      </div>
    );
  }

  if (codigo) {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-center">
        <div className="wf-check w-16 h-16 rounded-full flex items-center justify-center bg-success-background text-success-default"><CheckIcon size={24} /></div>
        <h2 className="font-heading text-[24px] leading-8">¡SE REGISTRÓ TU RECLAMO!</h2>
        <p className="text-[14px] text-text-secondary">
          Código {codigo} · Plazo de respuesta: 15 días hábiles{plazo ? ` (hasta ${plazo})` : ""}.
        </p>
        <div className="rounded-md bg-white border border-border-default w-full p-3 text-[12px] text-text-secondary">
          Puedes hacerle seguimiento por el chat o en Historial de pedidos → Reclamos.
        </div>
        <button onClick={() => router.push("/pedidos/reclamos")} className="wf-btn w-full py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover">
          VER EN HISTORIAL
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      {error ? <p className="text-[12px] text-error-default">{error}</p> : null}
      <ReclamoForm
        pedidoId={pedidoId}
        telefonoInicial={perfil.data?.celular ?? ""}
        onOk={async (input) => {
          try {
            await crear.mutateAsync(input);
          } catch {
            // onError already maps the API error to the visible message.
          }
        }}
        onCancelar={() => router.push("/pedidos")}
      />
    </div>
  );
}
