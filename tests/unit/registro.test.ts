import { describe, expect, it } from "vitest";
import {
  CELULAR_PERU_MENSAJE,
  crearRegistroSchema,
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

describe("crearRegistroSchema con política (SPEC-01 Req. 2)", () => {
  const politica: PoliticaContrasena = { minLength: 10, requireDigit: true, requireSymbol: true };

  it("bloquea una contraseña que no cumple la política cargada", () => {
    const r = crearRegistroSchema(politica).safeParse({ ...valido, contrasena: "secreto1234", confirmar: "secreto1234" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["contrasena"]);
  });

  it("acepta una contraseña que cumple la política", () => {
    const pass = "secreto1234!";
    expect(crearRegistroSchema(politica).safeParse({ ...valido, contrasena: pass, confirmar: pass }).success).toBe(true);
  });

  it("sin política mantiene solo el mínimo de 8", () => {
    expect(crearRegistroSchema().safeParse(valido).success).toBe(true);
  });
});

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

  it.each(["987654321", "+51987654321", "51 123456789", "123-456-789"])("acepta celular %s", (celular) => {
    expect(registroSchema.safeParse({ ...valido, celular }).success).toBe(true);
  });

  it.each(["12345678", "+1234567890", "+5198765432", "98765432a"])("rechaza celular %s", (celular) => {
    expect(registroSchema.safeParse({ ...valido, celular }).success).toBe(false);
  });

  it("exige aceptar los términos", () => {
    const r = registroSchema.safeParse({ ...valido, aceptaTerminos: undefined });
    expect(r.success).toBe(false);
  });

  it("usa la longitud mínima en español de la política", () => {
    const r = crearRegistroSchema({ longitudMinima: 12 }).safeParse({ ...valido, contrasena: "Abcdef1!xy", confirmar: "Abcdef1!xy" });
    expect(r.success).toBe(false);
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
  it("lee los campos en español y los alias como respaldo", () => {
    const es = evaluarPolitica({ longitudMinima: 10, requiereMayuscula: true }, "abc");
    const alias = evaluarPolitica({ minLength: 10, requireUpper: true }, "abc");
    expect(es.map((r) => r.etiqueta)).toEqual(["Al menos 10 caracteres", "Una mayúscula"]);
    expect(alias).toEqual(es);
  });

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

  it("traduce cada regla del 422 a un mensaje legible y cae al texto por defecto", () => {
    const fallo = describeRegistroFailure(422, "POLITICA_INCUMPLIDA", [
      { campo: "password", mensaje: "LONGITUD_MINIMA: 10", regla: "LONGITUD_MINIMA", esperado: 10 },
      { campo: "password", mensaje: "CARACTER_ESPECIAL: null", regla: "CARACTER_ESPECIAL", esperado: "null" },
      { campo: "password", mensaje: "REGLA_NUEVA: x", regla: "REGLA_NUEVA", esperado: "x" },
    ]);
    expect(fallo.erroresCampo?.contrasena).toBe(
      "Debe tener al menos 10 caracteres. Debe incluir un símbolo. No cumple la política de seguridad"
    );
    expect(
      describeRegistroFailure(422, "POLITICA_INCUMPLIDA", [{ campo: "password", mensaje: "legado" }]).erroresCampo
        ?.contrasena
    ).toBe("No cumple la política de seguridad");
    expect(describeRegistroFailure(422, "POLITICA_INCUMPLIDA", []).erroresCampo?.contrasena).toBe(
      "No cumple la política de seguridad"
    );
  });

  it("mapea los seis campos del BFF (incluidos nombres, apellidos y términos) al formulario", () => {
    const fallo = describeRegistroFailure(400, "VALIDACION", [
      { campo: "email", mensaje: "e" },
      { campo: "password", mensaje: "p" },
      { campo: "phone", mensaje: "t" },
      { campo: "firstName", mensaje: "n" },
      { campo: "lastName", mensaje: "a" },
      { campo: "acceptTerms", mensaje: "x" },
    ]);
    expect(fallo.erroresCampo).toEqual({
      correo: "e",
      contrasena: "p",
      celular: "t",
      nombres: "n",
      apellidos: "a",
      aceptaTerminos: "x",
    });
  });

  it("muestra cada regla que G7 puede reportar, sin `esperado` salvo en la longitud", () => {
    const reglas = [
      "LONGITUD_MINIMA",
      "MAYUSCULA",
      "MINUSCULA",
      "DIGITO",
      "CARACTER_ESPECIAL",
      "CONTRASENA_COMUN",
      "DATOS_PERSONALES",
      "YA_UTILIZADA",
    ];
    const fallo = describeRegistroFailure(
      422,
      "POLITICA_INCUMPLIDA",
      reglas.map((regla) => ({ campo: "password", mensaje: regla, regla }))
    );
    expect(fallo.erroresCampo?.contrasena).toBe(
      [
        "No alcanza la longitud mínima",
        "Debe incluir una mayúscula",
        "Debe incluir una minúscula",
        "Debe incluir un número",
        "Debe incluir un símbolo",
        "Es una contraseña demasiado común",
        "No debe contener tus datos personales",
        "Ya usaste esta contraseña antes. Elige una distinta",
      ].join(". ")
    );
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
