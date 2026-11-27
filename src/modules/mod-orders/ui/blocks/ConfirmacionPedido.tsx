"use client";

import { useRef, useState } from "react";
import { container } from "@/shared/di/container";
import { XIcon } from "@/shared/ui/icons";
import { reenviarConfirmacionUseCase } from "@/modules/mod-orders/application/reenviarConfirmacionUseCase";
import { mensajeReenvio } from "@/modules/mod-orders/application/errors/confirmacionMensajes";
import { httpStatus, problemCode } from "@/shared/api/httpError";
import {
  avisoConfirmacion,
  correoParaChat,
  textoReenviosRestantes,
} from "@/modules/mod-orders/domain/utils/confirmacionCorreo";
import { esMotivoFaltaStock } from "@/modules/mod-orders/domain/utils/anulacionUtils";

type EstadoReenvio =
  | { fase: "inicial" }
  | { fase: "enviando" }
  | { fase: "enviado"; restantes: number; correo: string }
  | { fase: "limite"; mensaje: string }
  | { fase: "error"; mensaje: string };

/**
 * Bloque CONFIRMACION_PEDIDO (SPEC-15, SPEC-16 Req. 3).
 * El aviso no promete que el correo ya llegó. "Reenviar correo" llama al BFF con
 * una Idempotency-Key nueva por clic; el 429 LIMITE_REENVIOS_EXCEDIDO o quedarse
 * sin reenvíos deshabilita el botón, y un fallo de red se puede reintentar.
 */
export function ConfirmacionPedido({
  pedidoId,
  correoEnmascarado,
  estado,
  nuevoEstado,
  motivo,
  reembolso,
}: {
  pedidoId: string;
  correoEnmascarado: string;
  estado?: string;
  nuevoEstado?: string;
  motivo?: string;
  reembolso?: string;
}) {
  const [estadoReenvio, setEstadoReenvio] = useState<EstadoReenvio>({ fase: "inicial" });
  // Bloquea el doble clic antes de que React vuelva a pintar el botón deshabilitado.
  const enCurso = useRef(false);

  const esAnulado = estado === "ANULADO" || nuevoEstado === "ANULADO";
  if (esAnulado) {
    const esStock = Boolean(motivo && esMotivoFaltaStock(motivo));
    const titulo = esStock ? "Anulado por falta de stock" : (motivo || "Pedido anulado");
    const reembolsoMensaje =
      reembolso || "Si corresponde un reembolso, se procesará al medio de pago original.";

    return (
      <div
        role="region"
        aria-label={`Detalle de anulación del pedido ${pedidoId}`}
        className="rounded-md bg-white border border-error-default/40 p-4 flex flex-col gap-2.5 text-center text-text-primary"
      >
        <div className="flex items-center justify-center text-error-default">
          <XIcon size={24} />
        </div>
        <p className="font-heading text-[18px] text-error-default uppercase">
          {`PEDIDO ${pedidoId} ANULADO`}
        </p>
        <p className="text-[14px] font-bold text-text-primary">{titulo}</p>
        <p className="text-[13px] text-text-secondary">
          Tu pedido no pudo ser procesado. {reembolsoMensaje}
        </p>
      </div>
    );
  }

  const sinReenvios =
    estadoReenvio.fase === "limite" || (estadoReenvio.fase === "enviado" && estadoReenvio.restantes <= 0);
  const enviando = estadoReenvio.fase === "enviando";

  async function reenviar() {
    if (enCurso.current || sinReenvios) return;
    enCurso.current = true;
    setEstadoReenvio({ fase: "enviando" });
    try {
      const r = await reenviarConfirmacionUseCase(container.pedidos, { pedidoId });
      setEstadoReenvio({ fase: "enviado", restantes: r.reenviosRestantes, correo: r.correoEnmascarado });
    } catch (error) {
      const code = problemCode(error);
      const mensaje = mensajeReenvio(code, httpStatus(error));
      setEstadoReenvio(code === "LIMITE_REENVIOS_EXCEDIDO" ? { fase: "limite", mensaje } : { fase: "error", mensaje });
    } finally {
      enCurso.current = false;
    }
  }

  // One line per sentence: the resend confirmation and, below it, how many are left.
  let estadoLineas: string[] = [];
  if (estadoReenvio.fase === "enviando") estadoLineas = ["Reenviando el correo…"];
  if (estadoReenvio.fase === "enviado") {
    estadoLineas = [
      `Listo, reenviamos la confirmación a ${correoParaChat(estadoReenvio.correo)}.`,
      textoReenviosRestantes(estadoReenvio.restantes),
    ];
  }
  if (estadoReenvio.fase === "limite" || estadoReenvio.fase === "error") estadoLineas = [estadoReenvio.mensaje];

  return (
    <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2 text-center text-text-primary">
      <p className="font-heading text-[20px] text-text-primary">¡PEDIDO {pedidoId} CONFIRMADO!</p>
      <p className="text-[13px] text-text-secondary">{avisoConfirmacion(correoEnmascarado)}.</p>
      <p className="text-[12px] text-text-secondary">¿No te llegó? Revisa tu carpeta de spam o reenvíalo.</p>
      <button
        type="button"
        onClick={reenviar}
        disabled={enviando || sinReenvios}
        aria-busy={enviando}
        className="text-[12px] font-semibold underline text-text-secondary disabled:opacity-40"
      >
        {enviando ? "Reenviando…" : "Reenviar correo"}
      </button>
      <p
        role="status"
        aria-live="polite"
        data-testid="estado-reenvio"
        className={`text-[12px] ${estadoReenvio.fase === "error" || estadoReenvio.fase === "limite" ? "text-error-default" : "text-text-secondary"}`}
      >
        {estadoLineas.map((linea) => (
          <span key={linea} className="block">{linea}</span>
        ))}
      </p>
    </div>
  );
}
