"use client";

import { useState } from "react";
import { CheckIcon, LockIcon } from "@/shared/ui/icons";
import { OtpInput } from "@/shared/ui/OtpInput";
import { useChatStore } from "@/shared/auth/chatStore";
import {
  AYUDA_CELULAR_AJENO,
  codigoOtpValido,
  normalizarCodigoOtp,
} from "@/shared/auth/otpCelular";
import { useOtpCelular } from "@/shared/auth/useOtpCelular";
import type { VerificacionOtpCelular } from "@/shared/auth/types";

export type OtpCelularFlowProps = {
  /** Número ya enmascarado por el backend (`+51 9****4321`). */
  celularEnmascarado?: string;
  /** Se ejecuta una sola vez cuando el backend confirma la verificación. */
  onVerificado: (resultado: VerificacionOtpCelular) => void;
  /** Vuelve al paso anterior sin perder el carrito. */
  onCancelar?: () => void;
  titulo?: string;
};

/**
 * Flujo completo de verificación del celular por OTP (SPEC-04).
 *
 * Reutilizado por "Mi cuenta" y por el checkout. Muestra el celular
 * enmascarado, reutiliza `OtpInput`, respeta la vigencia de 5 minutos y el
 * temporizador de reenvío, y deja el envío del código fuera del LLM.
 */
export function OtpCelularFlow({
  celularEnmascarado,
  onVerificado,
  onCancelar,
  titulo = "Verifica tu celular",
}: OtpCelularFlowProps) {
  const cliente = useChatStore((s) => s.cliente);
  const numero = celularEnmascarado ?? cliente?.celularEnmascarado ?? "";
  const otp = useOtpCelular(onVerificado);
  const [codigo, setCodigo] = useState("");
  const [solicitado, setSolicitado] = useState(false);
  const [ayudaNumero, setAyudaNumero] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const pedir = async () => {
    setErrorLocal(null);
    setCodigo("");
    try {
      await otp.solicitar();
      setSolicitado(true);
    } catch {
      setSolicitado(false);
    }
  };

  const verificar = async () => {
    if (!codigoOtpValido(codigo)) {
      setErrorLocal("Ingresa el código de 6 dígitos.");
      return;
    }
    setErrorLocal(null);
    try {
      await otp.verificar(codigo);
      setCodigo("");
    } catch {
      // El hook ya tradujo el problem+json a un mensaje visible.
    }
  };

  if (otp.estado === "verificado") {
    return (
      <div
        data-testid="otp-verificado"
        role="status"
        className="rounded-md bg-success-background border border-success-default p-3 flex items-center gap-2 text-[13px] text-success-default"
      >
        <CheckIcon size={20} />
        <span>¡Listo! Tu celular quedó verificado.</span>
      </div>
    );
  }

  const error = errorLocal ?? otp.error;

  if (!solicitado) {
    return (
      <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2" data-testid="otp-solicitar">
        <div className="flex items-center gap-2">
          <div className="wf-check w-10 h-10 rounded-full flex items-center justify-center bg-warning-background text-warning-default">
            <LockIcon size={20} />
          </div>
          <p className="text-[14px] font-bold">{titulo}</p>
        </div>
        <p className="text-[13px] text-text-secondary">
          Para coordinar la entrega necesitamos confirmar tu celular {numero || "registrado"}.
        </p>
        {error && (
          <p role="alert" className="text-[12px] text-error-default">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => void pedir()}
          disabled={otp.estado === "solicitando"}
          className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink disabled:opacity-60"
        >
          {otp.estado === "solicitando" ? "ENVIANDO…" : "ENVIAR CÓDIGO"}
        </button>
        <button
          type="button"
          onClick={() => setAyudaNumero(true)}
          className="text-[12px] font-semibold underline text-text-secondary"
        >
          Ese no es mi número
        </button>
        {ayudaNumero && <p className="text-[12px] text-text-secondary">{AYUDA_CELULAR_AJENO}</p>}
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="text-[12px] font-semibold underline text-text-secondary"
          >
            Volver
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2" data-testid="otp-verificar">
      <p className="text-[14px] font-bold">Ingresa el código de 6 dígitos</p>
      <p className="text-[12px] text-text-secondary">
        Lo enviamos a {numero || "tu celular"}.{" "}
        {otp.segundosVigencia > 0
          ? `Vigente ${otp.temporizadorVigencia}`
          : "El código venció."}
      </p>
      <label htmlFor="otp-celular-codigo" className="text-[12px] font-semibold">
        Código de verificación
      </label>
      <OtpInput
        id="otp-celular-codigo"
        value={codigo}
        onChange={(e) => setCodigo(normalizarCodigoOtp(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void verificar();
          }
        }}
        disabled={otp.estado === "verificando"}
        placeholder="••••••"
        invalid={Boolean(error)}
        aria-describedby={error ? "otp-celular-error" : undefined}
      />
      {otp.intentosRestantes !== null && otp.intentosRestantes <= 0 && (
        <p className="text-[12px] text-error-default">Sin intentos. Pide un código nuevo.</p>
      )}
      {error && (
        <p id="otp-celular-error" role="alert" className="text-[12px] text-error-default">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void verificar()}
        disabled={otp.estado === "verificando" || (otp.intentosRestantes ?? 1) <= 0}
        className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink disabled:opacity-60"
      >
        {otp.estado === "verificando" ? "VERIFICANDO…" : "VERIFICAR"}
      </button>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => void pedir()}
          disabled={!otp.puedeReenviar}
          className="text-[12px] font-semibold underline text-text-secondary disabled:opacity-50"
        >
          {otp.segundosReenvio > 0
            ? `Enviar otro código en ${otp.temporizadorReenvio}`
            : "Enviar otro código"}
        </button>
        <button
          type="button"
          onClick={() => setAyudaNumero((v) => !v)}
          className="text-[12px] font-semibold underline text-text-secondary"
        >
          Ese no es mi número
        </button>
      </div>
      {ayudaNumero && <p className="text-[12px] text-text-secondary">{AYUDA_CELULAR_AJENO}</p>}
      {onCancelar && (
        <button
          type="button"
          onClick={onCancelar}
          className="text-[12px] font-semibold underline text-text-secondary"
        >
          Volver
        </button>
      )}
    </div>
  );
}
