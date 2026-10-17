import { describe, expect, it } from "vitest";
import {
  CELULAR_PERU_MENSAJE,
  normalizarCelular,
  registroSchema,
} from "@/domain/schemas/registro.schema";
import {
  evaluarPolitica,
  POLITICA_POR_DEFECTO,
  politicaCumplida,
  type PoliticaContrasena,
} from "@/domain/utils/passwordPolicy";
import {
  describeRegistroFailure,
  describeReenvioFailure,
  describeVerificacionResult,
  REENVIO_NEUTRO,
} from "@/domain/utils/sesion";

const valido = {
  nombres: "Ana",
  apellidos: "Quispe",
  correo: "ana@ejemplo.com",
  celular: "+51987654321",
  contrasena: "secreto123",
  confirmar: "secreto123",
  aceptaTerminos: true as const,
};

describe("registroSchema (SPEC-01 Req. 1/2)", () => {
  it("acepta un formulario completo", () => {
    expect(registroSchema.safeParse(valido).success).toBe(true);
  });

  it("normaliza al formato +51 en `celular`", () => {
    const parsed = registroSchema.parse({ ...valido, celular: "987654321" });
    expect(parsed.celular).toBe("+51987654321");
  });

  it("rechaza correo inválido", () => {
    expect(registroSchema.safeParse({ ...valido, correo: "no-es-correo" }).success).toBe(false);
  });

  it("rechaza celular no peruano con el mensaje esperado", () => {
    const result = registroSchema.safeParse({ ...valido, celular: "+1234567890" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const mensaje = result.error.issues.find((i) => i.path[0] === "celular")?.message;
      expect(mensaje).toBe(CELULAR_PERU_MENSAJE);
    }
  });

  it("exige aceptar los términos", () => {
    expect(
      registroSchema.safeParse({ ...valido, aceptaTerminos: false }).success
    ).toBe(false);
  });

  it("exige que la confirmación coincida", () => {
    const result = registroSchema.safeParse({ ...valido, confirmar: "otra-cosa" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "confirmar")).toBe(true);
    }
  });

  it("exige contraseña de al menos 8 caracteres", () => {
    expect(
      registroSchema.safeParse({ ...valido, contrasena: "corta", confirmar: "corta" }).success
    ).toBe(false);
  });
});

describe("normalizarCelular (SPEC-01, escenario celular)", () => {
  it.each([
    ["987654321", "+51987654321"],
    ["51987654321", "+51987654321"],
    ["+51987654321", "+51987654321"],
    ["987 654 321", "+51987654321"],
    ["987-654-321", "+51987654321"],
  ])("normaliza %s", (entrada, esperado) => {
    expect(normalizarCelular(entrada)).toBe(esperado);
  });

  it("deja intacto un valor no reconocible", () => {
    expect(normalizarCelular("abc")).toBe("abc");
  });
});

describe("evaluarPolitica / politicaCumplida (SPEC-01 Req. 2)", () => {
  it("solo lista la longitud con la política por defecto", () => {
    const reglas = evaluarPolitica(POLITICA_POR_DEFECTO, "12345678");
    expect(reglas).toHaveLength(1);
    expect(reglas[0].cumple).toBe(true);
  });

  it("evalúa cada regla activa", () => {
    const politica: PoliticaContrasena = {
      minLength: 8,
      requireUpper: true,
      requireDigit: true,
    };
    const reglas = evaluarPolitica(politica, "abcdefgh");
    expect(reglas.map((r) => r.clave)).toEqual(["longitud", "mayuscula", "digito"]);
    expect(reglas.find((r) => r.clave === "mayuscula")?.cumple).toBe(false);
    expect(politicaCumplida(politica, "abcdefgh")).toBe(false);
    expect(politicaCumplida(politica, "Abcdefg1")).toBe(true);
  });
});

describe("describeRegistroFailure (SPEC-01 Req. 4)", () => {
  it("mapea los errores por campo del BFF a los campos del formulario", () => {
    const fallo = describeRegistroFailure(400, "VALIDACION", [
      { campo: "email", mensaje: "Correo inválido" },
      { campo: "phone", mensaje: "Celular inválido" },
    ]);
    expect(fallo.erroresCampo).toEqual({
      correo: "Correo inválido",
      celular: "Celular inválido",
    });
  });

  it("no revela si el correo existe (409 CORREO_NO_DISPONIBLE)", () => {
    const fallo = describeRegistroFailure(409, "CORREO_NO_DISPONIBLE");
    expect(fallo.message).not.toMatch(/existe|registrad/i);
    expect(fallo.ofrecerLogin).toBe(true);
  });

  it("marca la contraseña cuando la política falla", () => {
    const fallo = describeRegistroFailure(422, "POLITICA_INCUMPLIDA");
    expect(fallo.erroresCampo?.contrasena).toBeTruthy();
  });

  it("informa servicio no disponible y límite de intentos", () => {
    expect(describeRegistroFailure(503, "SERVICIO_NO_DISPONIBLE").message).toMatch(/intenta/i);
    expect(describeRegistroFailure(429).message).toMatch(/intentos/i);
  });
});

describe("describeVerificacionResult (SPEC-02 Req. 1)", () => {
  it("reconoce enlace vencido", () => {
    expect(describeVerificacionResult(410, "ENLACE_EXPIRADO").estado).toBe("vencido");
  });

  it("reconoce enlace ya usado", () => {
    expect(describeVerificacionResult(409, "ENLACE_YA_USADO").estado).toBe("usado");
  });

  it("cae en error genérico", () => {
    expect(describeVerificacionResult(500).estado).toBe("error");
  });
});

describe("describeReenvioFailure (SPEC-02 Req. 2)", () => {
  it("el mensaje neutro no confirma la existencia de la cuenta", () => {
    expect(REENVIO_NEUTRO).toMatch(/si hay una cuenta/i);
  });

  it("explica el límite de reenvíos", () => {
    expect(describeReenvioFailure(429, "DEMASIADAS_SOLICITUDES")).toMatch(/enlace/i);
  });

  it("informa servicio no disponible", () => {
    expect(describeReenvioFailure(503, "SERVICIO_NO_DISPONIBLE")).toMatch(/disponible/i);
  });
});
