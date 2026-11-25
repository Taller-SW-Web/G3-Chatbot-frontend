"use client";

import { useState } from "react";
import type { AxiosError } from "axios";
import { FormularioGenerico } from "@/modules/mod-chat/ui/blocks/FormularioGenerico";
import { ReenviarVerificacionForm } from "@/modules/mod-auth/public";
import { useChatStore } from "@/shared/auth/chatStore";
import { container } from "@/shared/di/container";
import { describeReenvioFailure, REENVIO_NEUTRO } from "@/shared/auth/sesion";

type ProblemShape = { code?: string };

function problemDe(error: unknown): { status?: number; code?: string } {
  const e = error as AxiosError<ProblemShape>;
  return { status: e?.response?.status, code: e?.response?.data?.code };
}

/** FORMULARIO/LOGIN: reutiliza el AuthModal global, que ya resuelve MFA y acción pendiente. */
export function FormularioLoginChat() {
  const cliente = useChatStore((s) => s.cliente);
  const setAuthOpen = useChatStore((s) => s.setAuthOpen);
  if (cliente) return null;
  return (
    <div data-testid="bloque-formulario-login">
      <FormularioGenerico titulo="Inicia sesión" etiqueta="INICIAR SESIÓN" onSubmit={() => setAuthOpen(true)}>
        <p className="text-[13px] text-text-secondary">
          Necesitas tu cuenta para ver pedidos, reclamos y devoluciones.
        </p>
      </FormularioGenerico>
    </div>
  );
}

/** FORMULARIO/REENVIO_VERIFICACION: mismo formulario y mensaje neutro que SPEC-02. */
export function FormularioReenvioVerificacionChat() {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(correo: string) {
    setCargando(true);
    setError(null);
    setMensaje(null);
    try {
      await container.auth.reenviarVerificacion(correo);
      setMensaje(REENVIO_NEUTRO);
    } catch (e) {
      const { status, code } = problemDe(e);
      setError(describeReenvioFailure(status, code));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      className="rounded-md bg-white border border-border-default p-3"
      data-testid="bloque-formulario-reenvio"
    >
      <ReenviarVerificacionForm
        onEnviar={(correo) => void enviar(correo)}
        mensaje={mensaje}
        error={error}
        cargando={cargando}
      />
    </div>
  );
}
