/** Casos de uso del OTP local del celular (SPEC-04). Sin React y sin red. */

import {
  codigoOtpValido,
  normalizarCodigoOtp,
} from "@/shared/auth/otpCelular";
import type {
  AuthPort,
  SolicitudOtpCelular,
  VerificacionOtpCelular,
} from "@/modules/mod-auth/ports/authPort";

/** Pide un código nuevo para el celular vigente del perfil. */
export function solicitarOtpCelularUseCase(api: AuthPort): Promise<SolicitudOtpCelular> {
  return api.solicitarOtpCelular();
}

/** Valida el código antes de llamar al backend: exactamente 6 dígitos. */
export function verificarOtpCelularUseCase(
  api: AuthPort,
  codigo: string
): Promise<VerificacionOtpCelular> {
  const limpio = normalizarCodigoOtp(codigo);
  if (!codigoOtpValido(limpio)) {
    return Promise.reject(new Error("El código debe tener 6 dígitos"));
  }
  return api.verificarOtpCelular(limpio);
}
