"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  codigoOtpValido,
  esperaDeReenvio,
  formatearTemporizador,
  mensajeOtpCelular,
  normalizarCodigoOtp,
  OTP_CELULAR_VIGENCIA_SEGUNDOS,
} from "@/shared/auth/otpCelular";
import { container } from "@/shared/di/container";
import type { VerificacionOtpCelular } from "@/shared/auth/types";

export type EstadoOtpCelular =
  | "inactivo"
  | "solicitando"
  | "enviado"
  | "verificando"
  | "verificado"
  | "error";

export type ResultadoSolicitudOtp = {
  celularEnmascarado?: string;
  expiraEnSegundos?: number;
};

/** Convierte `expiraEn` (ISO) en segundos restantes; nunca negativo. */
function segundosHasta(expiraEn: string | undefined): number {
  if (!expiraEn) return OTP_CELULAR_VIGENCIA_SEGUNDOS;
  const ms = new Date(expiraEn).getTime() - Date.now();
  if (!Number.isFinite(ms)) return OTP_CELULAR_VIGENCIA_SEGUNDOS;
  return Math.min(
    OTP_CELULAR_VIGENCIA_SEGUNDOS + 60,
    Math.max(0, Math.ceil(ms / 1000))
  );
}

/**
 * Estado del flujo OTP del celular (SPEC-04).
 *
 * Es la misma secuencia para "Mi cuenta" y checkout: solicitar, contar la
 * vigencia del código, verificar y respetar el temporizador de reenvío. El
 * código nunca sale del endpoint de auth.
 */
export function useOtpCelular(onVerificado?: (resultado: VerificacionOtpCelular) => void) {
  const [estado, setEstado] = useState<EstadoOtpCelular>("inactivo");
  const [error, setError] = useState<string | null>(null);
  const [segundosVigencia, setSegundosVigencia] = useState(0);
  const [segundosReenvio, setSegundosReenvio] = useState(0);
  const [intentosRestantes, setIntentosRestantes] = useState<number | null>(null);
  const [celularEnmascarado, setCelularEnmascarado] = useState<string | undefined>();
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  useEffect(() => {
    if (segundosVigencia <= 0) return;
    const timer = setTimeout(() => setSegundosVigencia((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [segundosVigencia]);

  useEffect(() => {
    if (segundosReenvio <= 0) return;
    const timer = setTimeout(() => setSegundosReenvio((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [segundosReenvio]);

  const solicitar = useCallback(async (): Promise<ResultadoSolicitudOtp> => {
    setEstado("solicitando");
    setError(null);
    try {
      const data = await container.auth.solicitarOtpCelular();
      if (!montado.current) return {};
      const segundos = segundosHasta(data.expiraEn);
      setCelularEnmascarado(data.celularEnmascarado);
      setSegundosVigencia(segundos);
      setSegundosReenvio(0);
      setIntentosRestantes(null);
      setEstado("enviado");
      return {
        celularEnmascarado: data.celularEnmascarado,
        expiraEnSegundos: segundos,
      };
    } catch (e) {
      if (montado.current) {
        setError(mensajeOtpCelular(e));
        setSegundosReenvio(esperaDeReenvio(e));
        setEstado("error");
      }
      throw e;
    }
  }, []);

  const verificar = useCallback(
    async (codigo: string): Promise<VerificacionOtpCelular> => {
      const limpio = normalizarCodigoOtp(codigo);
      if (!codigoOtpValido(limpio)) {
        setError("Ingresa el código de 6 dígitos.");
        return { celularVerificado: false, celularEnmascarado: celularEnmascarado ?? "" };
      }
      setEstado("verificando");
      setError(null);
      try {
        const data = await container.auth.verificarOtpCelular(limpio);
        if (!montado.current) return data;
        if (data.celularVerificado) {
          setEstado("verificado");
          setError(null);
          onVerificado?.(data);
        } else {
          setEstado("enviado");
          setError("No pudimos verificar el código. Inténtalo de nuevo.");
        }
        return data;
      } catch (e) {
        if (montado.current) {
          setEstado("enviado");
          setError(mensajeOtpCelular(e));
          const restantes = (e as { response?: { data?: { intentosRestantes?: unknown } } })
            ?.response?.data?.intentosRestantes;
          if (typeof restantes === "number") setIntentosRestantes(restantes);
        }
        throw e;
      }
    },
    [celularEnmascarado, onVerificado]
  );

  const reiniciar = useCallback(() => {
    setEstado("inactivo");
    setError(null);
    setSegundosVigencia(0);
    setSegundosReenvio(0);
    setIntentosRestantes(null);
  }, []);

  return useMemo(
    () => ({
      estado,
      error,
      celularEnmascarado,
      segundosVigencia,
      segundosReenvio,
      intentosRestantes,
      temporizadorVigencia: formatearTemporizador(segundosVigencia),
      temporizadorReenvio: formatearTemporizador(segundosReenvio),
      puedeReenviar:
        estado !== "solicitando" && estado !== "verificando" && segundosReenvio <= 0,
      solicitar,
      verificar,
      reiniciar,
    }),
    [
      estado,
      error,
      celularEnmascarado,
      segundosVigencia,
      segundosReenvio,
      intentosRestantes,
      solicitar,
      verificar,
      reiniciar,
    ]
  );
}
