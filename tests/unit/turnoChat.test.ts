import { describe, it, expect } from "vitest";
import {
  turnoChatReducer,
  turnoInicial,
  type AccionTurno,
  type TurnoChat,
} from "@/application/state/turnoChat";
import type { Bloque } from "@/domain/entities/Bloque";
import type { Mensaje } from "@/domain/entities/Mensaje";

const usuario: Mensaje = {
  id: "u-1",
  conversacionId: "c-1",
  rol: "user",
  texto: "hola",
  creadoEn: "2026-01-01T00:00:00Z",
};
const acciones: Bloque = {
  id: "b-1",
  tipo: "ACCIONES_RAPIDAS",
  acciones: [{ id: "VER_OFERTAS", etiqueta: "Ofertas" }],
};

function aplicar(acciones: AccionTurno[], inicio: TurnoChat = turnoInicial) {
  return acciones.reduce(turnoChatReducer, inicio);
}

const abrir: AccionTurno[] = [
  { tipo: "usuarioAgregado", mensaje: usuario },
  { tipo: "aceptado", idTemporal: "u-1", mensajeId: "m-1" },
];

describe("turnoChatReducer", () => {
  it("turno normal: intercambia el id, acumula y consolida con el id de fin", () => {
    const enCurso = aplicar([
      ...abrir,
      { tipo: "token", texto: "Ho" },
      { tipo: "token", texto: "la" },
      { tipo: "bloque", bloque: acciones },
    ]);
    expect(enCurso.estado).toBe("enviando");
    expect(enCurso.mensajes[0].id).toBe("m-1");
    expect(enCurso.borrador).toEqual({ texto: "Hola", bloques: [acciones], degradado: null });

    const fin = aplicar(
      [{ tipo: "fin", mensajeId: "m-2", conversacionId: "c-1", creadoEn: "t" }],
      enCurso
    );
    expect(fin.borrador).toBeNull();
    expect(fin.estado).toBe("inactivo");
    expect(fin.mensajes).toHaveLength(2);
    expect(fin.mensajes[1]).toEqual({
      id: "m-2",
      conversacionId: "c-1",
      rol: "bot",
      texto: "Hola",
      bloques: [acciones],
      creadoEn: "t",
    });
  });

  it("turno degradado: descarta los tokens y conserva los bloques posteriores", () => {
    const estado = aplicar([
      ...abrir,
      { tipo: "token", texto: "parcial" },
      { tipo: "degradado", motivo: "timeout" },
      { tipo: "bloque", bloque: acciones },
      { tipo: "fin", mensajeId: "m-2", conversacionId: "c-1", creadoEn: "t" },
    ]);
    const bot = estado.mensajes[1];
    expect(bot.texto).toBe("");
    expect(bot.bloques).toEqual([acciones]);
    expect(estado.borrador).toBeNull();
  });

  it("registra el motivo degradado en el borrador", () => {
    const estado = aplicar([...abrir, { tipo: "degradado", motivo: "unavailable" }]);
    expect(estado.borrador?.degradado).toBe("unavailable");
  });

  it("evento error: descarta el borrador, fija el código y conserva el mensaje del cliente", () => {
    const estado = aplicar([
      ...abrir,
      { tipo: "token", texto: "x" },
      { tipo: "error", code: "ERROR_INTERNO" },
    ]);
    expect(estado.borrador).toBeNull();
    expect(estado.estado).toBe("error");
    expect(estado.error).toEqual({ code: "ERROR_INTERNO" });
    expect(estado.mensajes).toHaveLength(1);
  });

  it("fallo previo: quita el mensaje optimista y fija status y código", () => {
    const estado = aplicar([
      { tipo: "usuarioAgregado", mensaje: usuario },
      { tipo: "falloPrevio", idTemporal: "u-1", code: "VALIDACION", status: 400 },
    ]);
    expect(estado.mensajes).toEqual([]);
    expect(estado.error).toEqual({ code: "VALIDACION", status: 400 });
    expect(estado.estado).toBe("error");
  });

  it("incompleto: descarta el borrador y marca incompleto", () => {
    const estado = aplicar([...abrir, { tipo: "token", texto: "x" }, { tipo: "incompleto" }]);
    expect(estado.borrador).toBeNull();
    expect(estado.incompleto).toBe(true);
    expect(estado.estado).toBe("inactivo");
    expect(estado.mensajes).toHaveLength(1);
  });

  it("un mensaje nuevo limpia el error y el incompleto previos", () => {
    const previo = aplicar([...abrir, { tipo: "incompleto" }]);
    const estado = aplicar([{ tipo: "usuarioAgregado", mensaje: { ...usuario, id: "u-2" } }], previo);
    expect(estado.incompleto).toBe(false);
    expect(estado.error).toBeNull();
  });

  it("historial cargado reemplaza los mensajes y vuelve a inactivo", () => {
    const cargando = aplicar([{ tipo: "historialCargando" }]);
    expect(cargando.estado).toBe("cargando");
    const estado = aplicar([{ tipo: "historialCargado", mensajes: [usuario] }], cargando);
    expect(estado.mensajes).toEqual([usuario]);
    expect(estado.estado).toBe("inactivo");
  });

  it("historial fallido deja estado error", () => {
    const estado = aplicar([{ tipo: "historialFallido", code: "ERROR_HISTORIAL" }]);
    expect(estado.estado).toBe("error");
    expect(estado.error).toEqual({ code: "ERROR_HISTORIAL" });
  });

  it("reiniciar vuelve al estado inicial", () => {
    expect(aplicar([...abrir, { tipo: "reiniciar" }])).toEqual(turnoInicial);
  });
});
