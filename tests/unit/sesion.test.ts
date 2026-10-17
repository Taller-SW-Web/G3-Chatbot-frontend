import { describe, it, expect } from "vitest";
import { loginSchema } from "@/domain/schemas/login.schema";
import { otpMfaSchema } from "@/domain/schemas/otpMfa.schema";
import {
  buildLoginGreeting,
  clienteDesdePerfil,
  clienteDesdeUsuario,
  describeLoginFailure,
  describeMfaResendFailure,
  describeOtpFailure,
  isTokenExpiringSoon,
} from "@/domain/utils/sesion";
import { createSingleFlight } from "@/domain/utils/singleFlight";

describe("session contracts (SPEC-03)", () => {
  it("login schema accepts email and password", () => {
    const r = loginSchema.safeParse({ correo: "a@b.pe", password: "secret123" });
    expect(r.success).toBe(true);
  });

  it("login schema rejects invalid email", () => {
    const r = loginSchema.safeParse({ correo: "no-email", password: "secret123" });
    expect(r.success).toBe(false);
  });

  it("mfa schema accepts six digits", () => {
    expect(otpMfaSchema.safeParse({ codigo: "123456" }).success).toBe(true);
  });

  it("mfa schema rejects short codes", () => {
    expect(otpMfaSchema.safeParse({ codigo: "123" }).success).toBe(false);
  });

  it("token expiring within sixty seconds needs refresh", () => {
    const now = Date.now();
    expect(isTokenExpiringSoon(now + 30 * 1000, now)).toBe(true);
    expect(isTokenExpiringSoon(now + 10 * 60 * 1000, now)).toBe(false);
    expect(isTokenExpiringSoon(null, now)).toBe(false);
  });

  it("login greeting uses first name", () => {
    expect(buildLoginGreeting("Maria Torres")).toBe("Hola, Maria");
    expect(buildLoginGreeting(null)).toBe("Hola");
  });
});

describe("login error mapping (SPEC-03 Req. 1)", () => {
  it("maps 401 CREDENCIALES_INVALIDAS to a generic credential message", () => {
    expect(describeLoginFailure(401, "CREDENCIALES_INVALIDAS").message).toBe(
      "Correo o contraseña incorrectos"
    );
  });

  it("maps 503 MODULO_NO_DISPONIBLE to a service message", () => {
    expect(describeLoginFailure(503, "MODULO_NO_DISPONIBLE").message).toContain("no está disponible");
  });

  it("maps 403 CUENTA_NO_PERMITIDA without a wrong-password message", () => {
    const r = describeLoginFailure(403, "CUENTA_NO_PERMITIDA");
    expect(r.message).not.toBe("Correo o contraseña incorrectos");
    expect(r.volverALogin).toBe(false);
  });

  it("maps 429 to a rate-limit message", () => {
    expect(describeLoginFailure(429).message).toContain("Demasiados intentos");
  });
});

describe("otp error mapping (SPEC-03 Req. 2)", () => {
  it("reports the remaining attempts", () => {
    const r = describeOtpFailure(401, "CODIGO_INVALIDO", 2);
    expect(r.message).toContain("2");
    expect(r.intentosRestantes).toBe(2);
    expect(r.volverALogin).toBe(false);
  });

  it("returns to login when attempts are exhausted", () => {
    const r = describeOtpFailure(429, "OTP_INTENTOS_AGOTADOS");
    expect(r.volverALogin).toBe(true);
    expect(r.message).toContain("Vuelve a iniciar sesión");
  });

  it("returns to login when the code expired", () => {
    expect(describeOtpFailure(410, "CODIGO_VENCIDO").volverALogin).toBe(true);
  });

  it("falls back to a generic invalid-code message", () => {
    expect(describeOtpFailure(401, "CODIGO_INVALIDO").message).toContain("Código incorrecto");
  });

  it("surfaces resend rate limits", () => {
    expect(describeMfaResendFailure(429, "LIMITE_REENVIOS").message).toContain("Espera");
  });
});

describe("cliente hydration (SPEC-03 Req. 3)", () => {
  it("builds a minimal client from the session user", () => {
    const c = clienteDesdeUsuario({ id: "9" }, "respaldo@x.pe");
    expect(c.id).toBe("9");
    expect(c.correo).toBe("respaldo@x.pe");
    expect(c.celularVerificado).toBe(false);
  });

  it("enriches the client with the masked profile", () => {
    const c = clienteDesdePerfil(
      {
        id: "1",
        nombreCompleto: "Maria Torres",
        correo: "m@t.pe",
        celular: "+51 987 654 321",
        celularVerificado: true,
        ultimoDocumento: { tipo: "DNI", numeroEnmascarado: "*****234" },
      },
      "fallback@x.pe"
    );
    expect(c.celularVerificado).toBe(true);
    expect(c.celularEnmascarado).toContain("321");
    expect(c.tipoDocumento).toBe("DNI");
    expect(c.documentoEnmascarado).toBe("*****234");
  });

  it("ignores an unknown document type", () => {
    const c = clienteDesdePerfil(
      {
        celularVerificado: false,
        ultimoDocumento: { tipo: "OTRO", numeroEnmascarado: "**1" },
      },
      "a@b.pe"
    );
    expect(c.tipoDocumento).toBeUndefined();
    expect(c.documentoEnmascarado).toBe("**1");
  });
});

describe("single-flight refresh (SPEC-03 Req. 5)", () => {
  it("coalesces concurrent calls into one execution", async () => {
    let calls = 0;
    let liberar: (v: string) => void = () => {};
    const single = createSingleFlight(() => {
      calls += 1;
      return new Promise<string>((resolve) => {
        liberar = resolve;
      });
    });
    const a = single();
    const b = single();
    expect(calls).toBe(1);
    liberar("ok");
    await expect(Promise.all([a, b])).resolves.toEqual(["ok", "ok"]);
  });

  it("runs again once the in-flight promise settles", async () => {
    let calls = 0;
    const single = createSingleFlight(async () => {
      calls += 1;
      return calls;
    });
    await single();
    await single();
    expect(calls).toBe(2);
  });
});
