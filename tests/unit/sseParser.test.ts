import { describe, it, expect } from "vitest";
import { crearSseParser, type SseFrame } from "@/adapters/outbound/sseParser";

const flujo =
  'event: aceptado\ndata: {"mensajeId":"m-1"}\n\n' +
  'event: token\ndata: {"texto":"Hola, ¿qué talla buscas? 👕"}\n\n' +
  'event: bloque\ndata: {"bloque":{"tipo":"texto","texto":"ñandú"}}\n\n' +
  'event: fin\ndata: {"mensajeId":"m-2"}\n\n';

const esperado: SseFrame[] = [
  { event: "aceptado", data: '{"mensajeId":"m-1"}' },
  { event: "token", data: '{"texto":"Hola, ¿qué talla buscas? 👕"}' },
  { event: "bloque", data: '{"bloque":{"tipo":"texto","texto":"ñandú"}}' },
  { event: "fin", data: '{"mensajeId":"m-2"}' },
];

function parsear(chunks: string[]): SseFrame[] {
  const parser = crearSseParser();
  return chunks.flatMap((c) => parser.push(c));
}

/** Parte los bytes UTF-8 en `corte` y decodifica como lo hace el adaptador. */
function parsearPartidoEnBytes(texto: string, corte: number): SseFrame[] {
  const bytes = new TextEncoder().encode(texto);
  const decoder = new TextDecoder("utf-8");
  const parser = crearSseParser();
  return [
    ...parser.push(decoder.decode(bytes.slice(0, corte), { stream: true })),
    ...parser.push(decoder.decode(bytes.slice(corte), { stream: true })),
  ];
}

describe("sseParser", () => {
  it("parsea un flujo completo en un solo chunk", () => {
    expect(parsear([flujo])).toEqual(esperado);
  });

  it("produce los mismos frames partiendo en cualquier byte (incluye multibyte)", () => {
    const total = new TextEncoder().encode(flujo).length;
    for (let corte = 0; corte <= total; corte++) {
      expect(parsearPartidoEnBytes(flujo, corte), `corte ${corte}`).toEqual(esperado);
    }
  });

  it("produce los mismos frames con un carácter por chunk", () => {
    expect(parsear([...flujo])).toEqual(esperado);
  });

  it("acepta finales de línea CRLF", () => {
    expect(parsear([flujo.replace(/\n/g, "\r\n")])).toEqual(esperado);
  });

  it("acepta CR solo como final de línea", () => {
    // El "\r" final se retiene (podría ser un CRLF); el siguiente chunk lo resuelve.
    expect(parsear([flujo.replace(/\n/g, "\r"), ": fin de flujo"])).toEqual(esperado);
  });

  it("maneja un CRLF partido entre dos chunks", () => {
    const crlf = flujo.replace(/\n/g, "\r\n");
    for (let corte = 0; corte <= crlf.length; corte++) {
      expect(parsear([crlf.slice(0, corte), crlf.slice(corte)]), `corte ${corte}`).toEqual(
        esperado
      );
    }
  });

  it("une varias líneas data con salto de línea", () => {
    expect(parsear(["event: token\ndata: uno\ndata: dos\ndata:\ndata: cuatro\n\n"])).toEqual([
      { event: "token", data: "uno\ndos\n\ncuatro" },
    ]);
  });

  it("ignora líneas de comentario", () => {
    expect(parsear([": keep-alive\nevent: fin\n: otro\ndata: {}\n\n"])).toEqual([
      { event: "fin", data: "{}" },
    ]);
  });

  it("quita un único espacio inicial tras los dos puntos", () => {
    expect(parsear(["event:fin\ndata:  dos espacios\n\n"])).toEqual([
      { event: "fin", data: " dos espacios" },
    ]);
  });

  it("no emite un frame final sin la línea en blanco", () => {
    expect(parsear(['event: token\ndata: {"texto":"a"}\n'])).toEqual([]);
    expect(parsear(['event: token\ndata: {"texto":"a"}'])).toEqual([]);
  });

  it("emite el frame pendiente cuando llega la línea en blanco", () => {
    const parser = crearSseParser();
    expect(parser.push("event: fin\ndata: {}\n")).toEqual([]);
    expect(parser.push("\n")).toEqual([{ event: "fin", data: "{}" }]);
  });

  it("no emite frames sin líneas data", () => {
    expect(parsear(["event: fin\n\n\n\n"])).toEqual([]);
  });

  it("usa 'message' cuando falta el campo event", () => {
    expect(parsear(["data: x\n\n"])).toEqual([{ event: "message", data: "x" }]);
  });

  it("entrega nombres desconocidos como frames crudos; el adaptador los filtra", () => {
    expect(parsear(["event: futuro\ndata: {}\n\n"])).toEqual([{ event: "futuro", data: "{}" }]);
  });

  it("ignora campos id y retry", () => {
    expect(parsear(["id: 7\nretry: 100\nevent: fin\ndata: {}\n\n"])).toEqual([
      { event: "fin", data: "{}" },
    ]);
  });

  it("el nombre de evento no se arrastra al frame siguiente", () => {
    expect(parsear(["event: token\ndata: a\n\ndata: b\n\n"])).toEqual([
      { event: "token", data: "a" },
      { event: "message", data: "b" },
    ]);
  });
});
