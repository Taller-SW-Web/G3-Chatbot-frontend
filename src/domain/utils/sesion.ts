/** Pure session helpers (SPEC-03). No React, no network, no storage. */

import type { Cliente, TipoDocumento } from "@/domain/entities/Cliente";
import { maskCelular } from "@/domain/utils/sanitize";
import type { PerfilCliente, UsuarioSesion } from "@/ports/outbound/ChatbotApiPort";

export const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000;
export const REFRESH_MARGIN_MS = 60 * 1000;

const TIPOS_DOCUMENTO: readonly TipoDocumento[] = ["DNI", "RUC", "CE", "PASAPORTE"];

/** True when the token expires within the refresh margin (SPEC-03 Req. 5). */
export function isTokenExpiringSoon(expiraEn: number | null, nowMs = Date.now()): boolean {
  if (!expiraEn) return false;
  return expiraEn - nowMs < REFRESH_MARGIN_MS;
}

/** Friendly greeting after login (SPEC-03 Req. 3, no pending action). */
export function buildLoginGreeting(nombre?: string | null): string {
  const first = (nombre ?? "").trim().split(" ")[0];
  return first ? `Hola, ${first}` : "Hola";
}

export type AuthFailure = {
  message: string;
  volverALogin: boolean;
  intentosRestantes?: number;
};

/** Maps the problem+json `code`/status of `/sesion/login` to a user message (SPEC-03 Req. 1/2). */
export function describeLoginFailure(status?: number, code?: string): AuthFailure {
  if (code === "CUENTA_NO_PERMITIDA" || status === 403) {
    return { message: "Esta cuenta no puede iniciar sesión en este canal", volverALogin: false };
  }
  if (code === "MODULO_NO_DISPONIBLE" || status === 503) {
    return { message: "El servicio no está disponible. Intenta de nuevo en unos segundos", volverALogin: false };
  }
  if (status === 429) {
    return { message: "Demasiados intentos. Espera un momento e inténtalo de nuevo", volverALogin: false };
  }
  if (code === "CREDENCIALES_INVALIDAS" || status === 401) {
    return { message: "Correo o contraseña incorrectos", volverALogin: false };
  }
  return { message: "No pudimos iniciar sesión. Inténtalo de nuevo", volverALogin: false };
}

/** Maps the problem+json `code`/status of `/sesion/mfa/verificar` to a message (SPEC-03 Req. 2). */
export function describeOtpFailure(
  status?: number,
  code?: string,
  intentosRestantes?: number
): AuthFailure {
  if (code === "OTP_INTENTOS_AGOTADOS") {
    return { message: "Agotaste los intentos. Vuelve a iniciar sesión para pedir un código nuevo", volverALogin: true };
  }
  if (code === "CODIGO_VENCIDO" || status === 410) {
    return { message: "El código venció. Vuelve a iniciar sesión para pedir uno nuevo", volverALogin: true };
  }
  if (code === "CUENTA_NO_PERMITIDA" || status === 403) {
    return { message: "Esta cuenta no puede iniciar sesión en este canal", volverALogin: true };
  }
  if (code === "MODULO_NO_DISPONIBLE" || status === 503) {
    return { message: "El servicio no está disponible. Intenta de nuevo en unos segundos", volverALogin: false };
  }
  if (intentosRestantes !== undefined) {
    const plural = intentosRestantes === 1 ? "intento" : "intentos";
    return {
      message: `Código incorrecto. Te quedan ${intentosRestantes} ${plural}`,
      volverALogin: intentosRestantes <= 0,
      intentosRestantes,
    };
  }
  if (code === "CODIGO_INVALIDO" || status === 401) {
    return { message: "Código incorrecto. Revisa e intenta de nuevo", volverALogin: false };
  }
  return { message: "No pudimos verificar el código. Inténtalo de nuevo", volverALogin: false };
}

/** Maps the problem+json `code`/status of `/sesion/mfa/solicitar` (resend / channel switch). */
export function describeMfaResendFailure(status?: number, code?: string): AuthFailure {
  if (code === "LIMITE_REENVIOS" || status === 429) {
    return { message: "Espera unos minutos antes de pedir otro código", volverALogin: false };
  }
  if (code === "CODIGO_VENCIDO" || status === 410) {
    return { message: "El código venció. Vuelve a iniciar sesión para pedir uno nuevo", volverALogin: true };
  }
  if (code === "MODULO_NO_DISPONIBLE" || status === 503) {
    return { message: "El servicio no está disponible. Intenta de nuevo en unos segundos", volverALogin: false };
  }
  return { message: "No pudimos enviar el código. Inténtalo de nuevo", volverALogin: false };
}

/** Builds the visible client right after opening a session (before `/perfil` resolves). */
export function clienteDesdeUsuario(usuario: UsuarioSesion, correoFallback: string): Cliente {
  return {
    id: usuario.id,
    nombreCompleto: usuario.nombreCompleto ?? "",
    correo: usuario.correo ?? correoFallback,
    celularVerificado: false,
  };
}

/** Enriches the visible client with `GET /sesion/perfil` (celular verificado + documento). */
export function clienteDesdePerfil(perfil: PerfilCliente, correoFallback: string): Cliente {
  const tipo = perfil.ultimoDocumento?.tipo;
  return {
    id: perfil.id,
    nombreCompleto: perfil.nombreCompleto ?? "",
    correo: perfil.correo ?? correoFallback,
    celular: perfil.celular,
    celularEnmascarado: perfil.celular ? maskCelular(perfil.celular) : undefined,
    celularVerificado: perfil.celularVerificado,
    tipoDocumento: (TIPOS_DOCUMENTO as readonly string[]).includes(tipo ?? "")
      ? (tipo as TipoDocumento)
      : undefined,
    documentoEnmascarado: perfil.ultimoDocumento?.numeroEnmascarado,
    ultimoDocumento: perfil.ultimoDocumento,
  };
}
