"use client";

import { useRef, useState } from "react";
import { container } from "@/infrastructure/di/container";
import { reenviarConfirmacionUseCase } from "@/application/use_cases/reenviarConfirmacionUseCase";
import { mensajeReenvio } from "@/application/errors/confirmacionMensajes";
import { httpStatus, problemCode } from "@/domain/utils/httpError";
import {
  avisoConfirmacion,
  correoParaChat,
  textoReenviosRestantes,
} from "@/domain/utils/confirmacionCorreo";

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
}: {
  pedidoId: string;
  correoEnmascarado: string;
}) {
  const [estado, setEstado] = useState<EstadoReenvio>({ fase: "inicial" });
  // Bloquea el doble clic antes de que React vuelva a pintar el botón deshabilitado.
  const enCurso = useRef(false);

  const sinReenvios =
    estado.fase === "limite" || (estado.fase === "enviado" && estado.restantes <= 0);
  const enviando = estado.fase === "enviando";

  async function reenviar() {
    if (enCurso.current || sinReenvios) return;
    enCurso.current = true;
    setEstado({ fase: "enviando" });
    try {
      const r = await reenviarConfirmacionUseCase(container.api, { pedidoId });
      setEstado({ fase: "enviado", restantes: r.reenviosRestantes, correo: r.correoEnmascarado });
    } catch (error) {
      const code = problemCode(error);
      const mensaje = mensajeReenvio(code, httpStatus(error));
      setEstado(code === "LIMITE_REENVIOS_EXCEDIDO" ? { fase: "limite", mensaje } : { fase: "error", mensaje });
    } finally {
      enCurso.current = false;
    }
  }

  let estadoTexto = "";
  if (estado.fase === "enviando") estadoTexto = "Reenviando el correo…";
  if (estado.fase === "enviado") {
    estadoTexto = `Listo, reenviamos la confirmación a ${correoParaChat(estado.correo)}. ${textoReenviosRestantes(estado.restantes)}`;
  }
  if (estado.fase === "limite" || estado.fase === "error") estadoTexto = estado.mensaje;

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
        className={`text-[12px] ${estado.fase === "error" || estado.fase === "limite" ? "text-error-default" : "text-text-secondary"}`}
      >
        {estadoTexto}
      </p>
    </div>
  );
}
