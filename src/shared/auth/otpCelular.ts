/** Reglas visibles de la verificación local del celular (SPEC-04).
 *
 * Solo traduce el problem+json del backend a mensajes y tiempos. Sin React y
 * sin red: la primitiva `OtpInput` y el hook `useOtpCelular` viven aparte.
 */

import { problemCode, problemNumber } from "@/shared/api/httpError";

/** Vigencia del código: 5 minutos (SPEC-04 Req. 2). */
export const OTP_CELULAR_VIGENCIA_SEGUNDOS = 5 * 60;

/** Espera por defecto si el backend limita los reenvíos sin indicar segundos. */
export const OTP_CELULAR_ESPERA_POR_DEFECTO = 15 * 60;

const MENSAJE_GENERICO = "No pudimos completar la verificación. Inténtalo de nuevo.";

/** Código visible de error del flujo OTP (nunca se ramifica por texto). */
export function mensajeOtpCelular(error: unknown): string {
  switch (problemCode(error)) {
    case "CODIGO_INCORRECTO":
    case "CODIGO_INVALIDO": {
      const intentos = problemNumber(error, "intentosRestantes");
      return intentos === undefined
        ? "Código incorrecto. Inténtalo de nuevo."
        : `Código incorrecto. Te quedan ${intentos} intento${intentos === 1 ? "" : "s"}.`;
    }
    case "CODIGO_VENCIDO":
      return "El código venció. Pide uno nuevo.";
    case "OTP_INTENTOS_AGOTADOS":
      return "Agotaste los intentos. Pide un código nuevo.";
    case "LIMITE_ENVIOS":
    case "LIMITE_REENVIOS":
      return "Espera unos minutos antes de pedir otro código.";
    case "DEMASIADAS_SOLICITUDES":
      return "Vas muy rápido, espera un momento.";
    case "CELULAR_NO_VERIFICADO":
      return "Para continuar necesitamos confirmar tu celular.";
    case "CELULAR_NO_DISPONIBLE":
      return "No pudimos confirmar tu celular ahora. Inténtalo en unos minutos.";
    case "SERVICIO_NO_DISPONIBLE":
      return "El servicio de verificación no está disponible. Inténtalo en unos minutos.";
    default:
      return MENSAJE_GENERICO;
  }
}

/** Segundos que el backend pide esperar antes de otro envío (`Retry-After` incluido). */
export function esperaDeReenvio(error: unknown): number {
  return (
    problemNumber(error, "reintentarEn") ??
    problemNumber(error, "esperaSegundos") ??
    problemNumber(error, "retryAfter") ??
    problemNumber(error, "segundos") ??
    OTP_CELULAR_ESPERA_POR_DEFECTO
  );
}

/** `mm:ss` para el temporizador del código y del reenvío. */
export function formatearTemporizador(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/** Código de 6 dígitos, sin espacios. */
export function normalizarCodigoOtp(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, 6);
}

/** Un código solo es enviable cuando tiene exactamente 6 dígitos. */
export function codigoOtpValido(valor: string): boolean {
  return /^\d{6}$/.test(valor);
}

/** Texto de ayuda cuando el celular del perfil no es el del cliente. */
export const AYUDA_CELULAR_AJENO =
  "El cambio de celular se hace desde tu perfil de cuenta. Tu carrito se conserva.";
