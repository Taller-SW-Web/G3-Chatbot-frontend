import { describe, it, expect } from "vitest";
import { mapearHistorial } from "@/adapters/outbound/mapearHistorial";

const base = {
  id: "m-1",
  conversacionId: "c-1",
  rol: "user",
  texto: "hola",
  bloques: null,
  creadoEn: "2026-10-16T10:00:00Z",
};

const bloque = { id: "b-1", tipo: "TEXTO", texto: "hola" };

describe("mapearHistorial", () => {
  it("mapea mensajes con y sin bloques", () => {
    const res = mapearHistorial([
      base,
      { ...base, id: "m-2", rol: "bot", bloques: { blocks: [bloque] } },
    ]);
    expect(res).toHaveLength(2);
    expect(res[0]).toEqual({
      id: "m-1",
      conversacionId: "c-1",
      rol: "user",
      texto: "hola",
      creadoEn: "2026-10-16T10:00:00Z",
    });
    expect("bloques" in res[0]).toBe(false);
    expect(res[1].rol).toBe("bot");
    expect(res[1].bloques).toEqual([bloque]);
  });

  it("acepta bloques que ya son un arreglo", () => {
    expect(mapearHistorial([{ ...base, bloques: [bloque] }])[0].bloques).toEqual([bloque]);
  });

  it("omite bloques ausentes o de forma desconocida", () => {
    const sinBloques: Record<string, unknown> = { ...base };
    delete sinBloques.bloques;
    expect(mapearHistorial([sinBloques])[0].bloques).toBeUndefined();
    expect(mapearHistorial([{ ...base, bloques: "x" }])[0].bloques).toBeUndefined();
    expect(mapearHistorial([{ ...base, bloques: { blocks: "x" } }])[0].bloques).toBeUndefined();
    expect(mapearHistorial([{ ...base, bloques: { blocks: [1] } }])[0].bloques).toBeUndefined();
  });

  it("devuelve una lista vacía para un arreglo vacío", () => {
    expect(mapearHistorial([])).toEqual([]);
  });

  it("rechaza un cuerpo que no es una lista", () => {
    expect(() => mapearHistorial({ items: [] })).toThrow(/lista de mensajes/);
    expect(() => mapearHistorial(null)).toThrow(/lista de mensajes/);
  });

  it("rechaza un mensaje sin id", () => {
    const sinId: Record<string, unknown> = { ...base };
    delete sinId.id;
    expect(() => mapearHistorial([sinId])).toThrow(/"id"/);
  });

  it("rechaza un rol desconocido", () => {
    expect(() => mapearHistorial([{ ...base, rol: "CUSTOMER" }])).toThrow(/"rol"/);
  });

  it("rechaza un elemento que no es objeto", () => {
    expect(() => mapearHistorial(["x"])).toThrow(/no es un objeto/);
  });
});
