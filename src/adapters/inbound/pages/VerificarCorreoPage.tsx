"use client";

import { useEffect, useRef, useState } from "react";
import type { AxiosError } from "axios";
import { CheckIcon, FileAlertIcon } from "../components/icons";
import { ReenviarVerificacionForm } from "../components/forms/ReenviarVerificacionForm";
import { container } from "@/infrastructure/di/container";
import { useChatStore } from "@/application/state/chatStore";
import {
  describeReenvioFailure,
  describeVerificacionResult,
  REENVIO_NEUTRO,
  type VerificacionResultado,
} from "@/domain/utils/sesion";

type Estado = "verificando" | "exito" | "vencido" | "usado" | "error";

const SIN_TOKEN: VerificacionResultado = {
  estado: "error",
  titulo: "Enlace inválido",
  mensaje: "El enlace no es válido o está incompleto. Solicita uno nuevo para activar tu cuenta.",
};

/**
 * SPEC-02 Req. 1: canjea el enlace una sola vez y muestra el estado resultante.
 * El token se elimina de la barra de direcciones para no dejarlo en el historial.
 */
export function VerificarCorreoPage({ token }: { token?: string }) {
  const setAuthOpen = useChatStore((s) => s.setAuthOpen);
  const [estado, setEstado] = useState<Estado>(token ? "verificando" : "error");
  const [detalle, setDetalle] = useState<VerificacionResultado>(SIN_TOKEN);
  const [reenviando, setReenviando] = useState(false);
  const [reenvioEstado, setReenvioEstado] = useState<{ mensaje?: string; error?: string }>({});
  const lanzado = useRef(false);

  useEffect(() => {
    if (!token || lanzado.current) return;
    lanzado.current = true;
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/verificar-correo");
    }
    container.api
      .verificarCorreo(token)
      .then(() => setEstado("exito"))
      .catch((error) => {
        const e = error as AxiosError<{ code?: string }>;
        const info = describeVerificacionResult(e?.response?.status, e?.response?.data?.code);
        setDetalle(info);
        setEstado(info.estado);
      });
  }, [token]);

  async function reenviar(correo: string) {
    setReenviando(true);
    setReenvioEstado({});
    try {
      await container.api.reenviarVerificacion(correo);
      setReenvioEstado({ mensaje: REENVIO_NEUTRO });
    } catch (error) {
      const e = error as AxiosError<{ code?: string }>;
      setReenvioEstado({ error: describeReenvioFailure(e?.response?.status, e?.response?.data?.code) });
    } finally {
      setReenviando(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
      {estado === "verificando" && (
        <>
          <p role="status" className="text-[14px] text-text-secondary">
            Verificando tu correo…
          </p>
        </>
      )}

      {estado === "exito" && (
        <>
          <span className="w-14 h-14 rounded-full bg-success-background text-success-default flex items-center justify-center">
            <CheckIcon size={24} />
          </span>
          <h1 className="font-heading text-[20px]">¡TU CUENTA ESTÁ ACTIVA!</h1>
          <p className="text-[14px] text-text-secondary">Ya puedes iniciar sesión y continuar donde estabas.</p>
          <button onClick={() => setAuthOpen(true)}
            className="wf-btn w-full py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink">
            INICIAR SESIÓN
          </button>
        </>
      )}

      {(estado === "vencido" || estado === "usado" || estado === "error") && (
        <>
          <span className="w-14 h-14 rounded-full bg-warning-background text-warning-default flex items-center justify-center">
            <FileAlertIcon size={24} />
          </span>
          <h1 className="font-heading text-[20px] uppercase">{detalle.titulo}</h1>
          <p className="text-[14px] text-text-secondary">{detalle.mensaje}</p>
          {estado !== "usado" && (
            <div className="w-full text-left">
              <ReenviarVerificacionForm
                onEnviar={(correo) => void reenviar(correo)}
                mensaje={reenvioEstado.mensaje}
                error={reenvioEstado.error}
                cargando={reenviando}
              />
            </div>
          )}
          <button onClick={() => setAuthOpen(true)}
            className="text-[12px] font-semibold underline text-text-secondary">
            Ir a iniciar sesión
          </button>
        </>
      )}
    </div>
  );
}
