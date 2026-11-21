import { describe, expect, it } from "vitest";
import {
  codigoOtpValido,
  esperaDeReenvio,
  formatearTemporizador,
  mensajeOtpCelular,
  normalizarCodigoOtp,
} from "@/shared/auth/otpCelular";

describe("reglas visibles del OTP de celular (SPEC-04)", () => {
  it("normaliza a 6 dígitos y valida el largo", () => {
    expect(normalizarCodigoOtp(" 12-34 56 78 ")).toBe("123456");
    expect(codigoOtpValido("123456")).toBe(true);
    expect(codigoOtpValido("12345")).toBe(false);
    expect(codigoOtpValido("12a456")).toBe(false);
  });

  it("formatea el temporizador en mm:ss", () => {
    expect(formatearTemporizador(300)).toBe("05:00");
    expect(formatearTemporizador(61)).toBe("01:01");
    expect(formatearTemporizador(-4)).toBe("00:00");
  });

  it("traduce los códigos del problem+json a mensajes humanos", () => {
    const error = (code: string, extra: Record<string, unknown> = {}) => ({
      response: { status: 400, data: { code, ...extra } },
    });
    expect(mensajeOtpCelular(error("CODIGO_INCORRECTO", { intentosRestantes: 1 }))).toBe(
      "Código incorrecto. Te quedan 1 intento."
    );
    expect(mensajeOtpCelular(error("CODIGO_INVALIDO", { intentosRestantes: 2 }))).toBe(
      "Código incorrecto. Te quedan 2 intentos."
    );
    expect(mensajeOtpCelular(error("CODIGO_VENCIDO"))).toBe("El código venció. Pide uno nuevo.");
    expect(mensajeOtpCelular(error("LIMITE_ENVIOS"))).toBe(
      "Espera unos minutos antes de pedir otro código."
    );
    expect(mensajeOtpCelular(error("LIMITE_REENVIOS"))).toBe(
      "Espera unos minutos antes de pedir otro código."
    );
    expect(mensajeOtpCelular(error("DEMASIADAS_SOLICITUDES"))).toBe(
      "Vas muy rápido, espera un momento."
    );
    expect(mensajeOtpCelular(new Error("sin red"))).toContain("No pudimos completar");
  });

  it("usa los segundos del backend o el valor por defecto para el reenvío", () => {
    expect(esperaDeReenvio({ response: { data: { reintentarEn: 60 } } })).toBe(60);
    expect(esperaDeReenvio({ response: { data: { esperaSegundos: 45 } } })).toBe(45);
    expect(esperaDeReenvio({ response: { data: { retryAfter: "30" } } })).toBe(30);
    expect(esperaDeReenvio(new Error("sin datos"))).toBe(15 * 60);
  });
});
