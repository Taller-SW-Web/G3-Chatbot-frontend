import { describe, it, expect } from "vitest";
import { mapearHistorial } from "@/modules/mod-chat/adapters/mapearHistorial";

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

  it("mapea los adjuntos del mensaje con sus URLs firmadas (SPEC-23)", () => {
    const [mensaje] = mapearHistorial([
      {
        ...base,
        adjuntos: [
          {
            adjuntoId: "a-1",
            mimeType: "image/png",
            ancho: 800,
            alto: 600,
            urlMiniatura: "https://firmada/mini",
            expiraEn: "2026-11-20T12:00:00Z",
          },
          { id: "a-2", mime_type: "image/webp" },
          { mimeType: "image/png" },
        ],
      },
    ]);
    expect(mensaje.adjuntos).toHaveLength(2);
    expect(mensaje.adjuntos?.[0]).toMatchObject({
      adjuntoId: "a-1",
      ancho: 800,
      urlMiniatura: "https://firmada/mini",
    });
    expect(mensaje.adjuntos?.[1]).toMatchObject({ adjuntoId: "a-2", mimeType: "image/webp" });
  });

  it("omite adjuntos que no son una lista o no tienen id", () => {
    expect(mapearHistorial([{ ...base, adjuntos: "x" }])[0].adjuntos).toBeUndefined();
    expect(mapearHistorial([{ ...base, adjuntos: [{ mimeType: "image/png" }] }])[0].adjuntos).toBeUndefined();
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
