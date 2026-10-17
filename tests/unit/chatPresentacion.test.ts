import { describe, it, expect } from "vitest";
import {
  avisoDeTurno,
  construirItemsChat,
  historialFallido,
  mensajePorCodigo,
  mostrarEscribiendo,
  puedeEnviar,
} from "@/adapters/inbound/components/chatPresentacion";
import type { BorradorBot } from "@/application/state/turnoChat";
import type { Bloque } from "@/domain/entities/Bloque";
import type { Mensaje } from "@/domain/entities/Mensaje";

const acciones: Bloque = {
  id: "b-1",
  tipo: "ACCIONES_RAPIDAS",
  acciones: [{ id: "VER_OFERTAS", etiqueta: "Ver ofertas" }],
};
const usuario: Mensaje = {
  id: "m-1",
  conversacionId: "c-1",
  rol: "user",
  texto: "hola",
  creadoEn: "2026-01-01T00:00:00Z",
};
const bot: Mensaje = { ...usuario, id: "m-2", rol: "bot", texto: "¿Qué buscas?", bloques: [acciones] };
const borrador = (texto: string, bloques: Bloque[] = []): BorradorBot => ({
  texto,
  bloques,
  degradado: null,
});

describe("mensajePorCodigo", () => {
  it.each([
    "ERROR_INTERNO",
    "ERROR_RED",
    "STREAM_INVALIDO",
    "VALIDACION",
    "FUNCIONALIDAD_NO_DISPONIBLE",
    "ERROR_HISTORIAL",
  ])("da un mensaje propio para %s", (code) => {
    expect(mensajePorCodigo(code)).not.toBe(mensajePorCodigo("CODIGO_DESCONOCIDO"));
  });

  it("conserva los mensajes de los códigos de bloque", () => {
    expect(mensajePorCodigo("REQUIERE_SESION")).toBe("Inicia sesión para continuar.");
  });

  it("usa un mensaje genérico para un code desconocido", () => {
    expect(mensajePorCodigo("XYZ")).toBe("Hubo un problema. Inténtalo de nuevo.");
  });

  it("recurre al status cuando el code no se conoce", () => {
    expect(mensajePorCodigo("XYZ", 404)).toBe("No encontramos esta conversación.");
    expect(mensajePorCodigo("XYZ", 400)).toContain("no es válido");
  });

  it("el code conocido gana sobre el status", () => {
    expect(mensajePorCodigo("FUNCIONALIDAD_NO_DISPONIBLE", 501)).toBe(
      "Esta función todavía no está disponible."
    );
  });
});

describe("construirItemsChat", () => {
  it("mapea los mensajes con sus bloques y sin streaming", () => {
    expect(construirItemsChat([usuario, bot], null)).toEqual([
      { clave: "m-1", rol: "user", texto: "hola", bloques: [], streaming: false },
      { clave: "m-2", rol: "bot", texto: "¿Qué buscas?", bloques: [acciones], streaming: false },
    ]);
  });

  it("agrega la respuesta en construcción con streaming", () => {
    const items = construirItemsChat([usuario], borrador("Hola, soy"));
    expect(items.at(-1)).toEqual({
      clave: "borrador",
      rol: "bot",
      texto: "Hola, soy",
      bloques: [],
      streaming: true,
    });
  });

  it("muestra el borrador que solo tiene bloques", () => {
    const items = construirItemsChat([usuario], borrador("", [acciones]));
    expect(items.at(-1)?.streaming).toBe(true);
  });

  it("no agrega un borrador vacío", () => {
    expect(construirItemsChat([usuario], borrador(""))).toHaveLength(1);
  });
});

describe("mostrarEscribiendo", () => {
  it("se muestra mientras se envía y el borrador está vacío", () => {
    expect(mostrarEscribiendo("enviando", borrador(""))).toBe(true);
    expect(mostrarEscribiendo("enviando", null)).toBe(true);
  });

  it("se oculta cuando llega texto o un bloque", () => {
    expect(mostrarEscribiendo("enviando", borrador("Ho"))).toBe(false);
    expect(mostrarEscribiendo("enviando", borrador("", [acciones]))).toBe(false);
  });

  it("se oculta fuera de un envío", () => {
    expect(mostrarEscribiendo("inactivo", borrador(""))).toBe(false);
    expect(mostrarEscribiendo("cargando", null)).toBe(false);
  });
});

describe("avisoDeTurno", () => {
  it("un error de stream es reintentable", () => {
    expect(avisoDeTurno("error", { code: "ERROR_INTERNO" }, false)).toEqual({
      texto: mensajePorCodigo("ERROR_INTERNO"),
      reintentable: true,
    });
  });

  it("un fallo previo al stream no es reintentable (el texto vuelve al campo)", () => {
    expect(avisoDeTurno("error", { code: "VALIDACION", status: 400 }, false)).toEqual({
      texto: mensajePorCodigo("VALIDACION", 400),
      reintentable: false,
    });
  });

  it("una respuesta incompleta ofrece reintentar", () => {
    expect(avisoDeTurno("inactivo", null, true)).toEqual({
      texto: "La respuesta no se completó.",
      reintentable: true,
    });
  });

  it("el fallo del historial no es un aviso del turno", () => {
    expect(avisoDeTurno("error", { code: "ERROR_HISTORIAL" }, false)).toBeNull();
  });

  it("sin error ni incompleto no hay aviso", () => {
    expect(avisoDeTurno("inactivo", null, false)).toBeNull();
  });
});

describe("historialFallido", () => {
  it("solo es verdadero para el error de historial", () => {
    expect(historialFallido("error", { code: "ERROR_HISTORIAL" })).toBe(true);
    expect(historialFallido("error", { code: "ERROR_RED" })).toBe(false);
    expect(historialFallido("inactivo", null)).toBe(false);
  });
});

describe("puedeEnviar", () => {
  it("acepta texto normal en reposo o tras un error", () => {
    expect(puedeEnviar("hola", "inactivo")).toBe(true);
    expect(puedeEnviar("hola", "error")).toBe(true);
  });

  it("ignora vacío y espacios", () => {
    expect(puedeEnviar("", "inactivo")).toBe(false);
    expect(puedeEnviar("   \n", "inactivo")).toBe(false);
  });

  it("respeta el máximo de 1000 caracteres tras recortar", () => {
    expect(puedeEnviar("a".repeat(1000), "inactivo")).toBe(true);
    expect(puedeEnviar(`  ${"a".repeat(1000)}  `, "inactivo")).toBe(true);
    expect(puedeEnviar("a".repeat(1001), "inactivo")).toBe(false);
  });

  it("no envía mientras se envía o se carga", () => {
    expect(puedeEnviar("hola", "enviando")).toBe(false);
    expect(puedeEnviar("hola", "cargando")).toBe(false);
  });
});
