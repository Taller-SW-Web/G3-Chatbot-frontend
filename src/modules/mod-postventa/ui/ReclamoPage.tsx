"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CheckIcon } from "@/shared/ui/icons";
import { ReclamoForm } from "@/modules/mod-postventa/ui/forms/ReclamoForm";
import { container } from "@/shared/di/container";
import { usePerfil } from "@/shared/auth/usePerfil";
import { useChatStore } from "@/shared/auth/chatStore";
import type { ReclamoInput } from "@/modules/mod-postventa/domain/schemas/reclamo.schema";
import type { CrearReclamoInput } from "@/modules/mod-postventa/ports/postventaPort";
import {
  esReclamoDuplicado,
  solicitudDuplicada,
  type SolicitudDuplicada,
} from "@/modules/mod-postventa/domain/utils/duplicados";
import { DuplicateNotice } from "@/modules/mod-postventa/ui/blocks/DuplicateNotice";
import { isUnavailable, problemCode } from "@/shared/api/httpError";

/** `/reclamo?pedidoId=...`: registro real en el Libro de Reclamaciones (SPEC-19). */
export function ReclamoPage() {
  const router = useRouter();
  const params = useSearchParams();
  const pedidoId = params.get("pedidoId") ?? "";
  const [codigo, setCodigo] = useState<string | null>(null);
  const [plazo, setPlazo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicado, setDuplicado] = useState<SolicitudDuplicada | null>(null);
  const [ultimoEnvio, setUltimoEnvio] = useState<CrearReclamoInput | null>(null);

  const perfil = usePerfil();
  const cliente = useChatStore((s) => s.cliente);
  const ultimoPedido = useChatStore((s) => s.ultimoPedido);

  const nombreInicial = perfil.data?.nombreCompleto || cliente?.nombreCompleto || ultimoPedido?.nombre || "";
  const emailInicial = perfil.data?.correo || cliente?.correo || "";
  // SPEC-19 :24,110: usar el documento no enmascarado del último pedido; si no existe o viene enmascarado,
  // dejar vacío para que el cliente ingrese su número completo (SPEC-03 :211).
  const docUltimoPedido = (ultimoPedido as { documento?: string } | null)?.documento ?? "";
  const documentoInicial = docUltimoPedido && !docUltimoPedido.includes("*") ? docUltimoPedido : "";
  const telefonoInicial = perfil.data?.celular ?? cliente?.celular ?? "";

  const crear = useMutation({
    mutationFn: ({ input, forzar }: { input: CrearReclamoInput; forzar?: boolean }) =>
      container.postventa.crearReclamo({ ...input, ...(forzar ? { forzar: true } : {}) }),
    onSuccess: (data) => {
      setError(null);
      setDuplicado(null);
      setCodigo(data.codigoSeguimiento);
      setPlazo(data.fechaLimiteSLA ? new Date(data.fechaLimiteSLA).toLocaleDateString("es-PE") : null);
    },
    onError: (err) => {
      const code = problemCode(err);
      if (esReclamoDuplicado(err)) {
        setError(null);
        setDuplicado(solicitudDuplicada(err));
      } else if (isUnavailable(err)) setError("El servicio de reclamos no está disponible. Intenta de nuevo.");
      else if (code === "RECURSO_NO_ENCONTRADO") setError("No encontré ese pedido en tu cuenta.");
      else if (code === "DATOS_INVALIDOS" || code === "VALIDACION") setError("Revisa los datos del formulario e intenta de nuevo.");
      else setError("No pudimos registrar tu reclamo. Intenta de nuevo en unos minutos.");
    },
  });

  function payloadDe(input: ReclamoInput): CrearReclamoInput {
    const nombre = input.nombre?.trim() || nombreInicial || "";
    const email = input.email?.trim() || emailInicial || "";
    const documento = input.documento?.trim();
    const telefono = input.telefono?.trim();

    if (!documento || !nombre || !email) {
      setError("Completa los datos del consumidor para registrar el reclamo.");
      throw new Error("Datos del consumidor incompletos");
    }

    return {
      pedidoId: input.pedidoId,
      tipo: input.tipo,
      motivo: input.motivo,
      detalle: input.descripcion + (input.solucion ? `\n\nSolución esperada: ${input.solucion}` : ""),
      consumidor: {
        nombreCompleto: nombre,
        documento,
        email,
        telefono,
      },
      solucionEsperada: input.solucion,
    };
  }

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
      {duplicado && (
        <DuplicateNotice
          duplicado={duplicado}
          cargando={crear.isPending}
          onForzar={() => {
            if (!ultimoEnvio) return;
            void crear.mutateAsync({ input: ultimoEnvio, forzar: true }).catch(() => undefined);
          }}
        />
      )}
      <ReclamoForm
        pedidoId={pedidoId}
        nombreInicial={nombreInicial}
        emailInicial={emailInicial}
        documentoInicial={documentoInicial}
        telefonoInicial={telefonoInicial}
        onOk={async (input) => {
          const payload = payloadDe(input);
          setUltimoEnvio(payload);
          try {
            await crear.mutateAsync({ input: payload });
          } catch {
            // onError already maps the API error to the visible message.
          }
        }}
        onCancelar={() => router.push("/pedidos")}
      />
    </div>
  );
}
