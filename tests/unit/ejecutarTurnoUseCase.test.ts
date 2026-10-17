import { describe, it, expect, vi } from "vitest";
import type { AccionTurno } from "@/application/state/turnoChat";
import { ejecutarTurnoUseCase } from "@/application/use_cases/ejecutarTurnoUseCase";
import type { Mensaje } from "@/domain/entities/Mensaje";
import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";
import {
  ChatStreamError,
  type ChatStreamEvento,
  type ChatStreamPort,
} from "@/ports/outbound/ChatStreamPort";

const msg = (id: string, rol: Mensaje["rol"]): Mensaje => ({
  id,
  conversacionId: "c-1",
  rol,
  texto: id,
  creadoEn: "t",
});

function preparar(opciones: {
  eventos?: ChatStreamEvento[];
  falla?: unknown;
  historial?: Mensaje[] | Error;
}) {
  const enviarMensajeStream = vi.fn<ChatStreamPort["enviarMensajeStream"]>(
    async (_id, _texto, onEvento) => {
      for (const e of opciones.eventos ?? []) onEvento(e);
      if (opciones.falla) throw opciones.falla;
    }
  );
  const cargarHistorial = vi.fn(async () => {
    if (opciones.historial instanceof Error) throw opciones.historial;
    return opciones.historial ?? [];
  });
  const acciones: AccionTurno[] = [];
  const ejecutar = (texto = "hola", signal?: AbortSignal) =>
    ejecutarTurnoUseCase({
      api: { cargarHistorial } as unknown as ChatbotApiPort,
      stream: { enviarMensajeStream },
      conversacionId: "c-1",
      texto,
      dispatch: (a) => acciones.push(a),
      signal,
    });
  return { ejecutar, acciones, enviarMensajeStream, cargarHistorial };
}

const tipos = (acciones: AccionTurno[]) => acciones.map((a) => a.tipo);

describe("ejecutarTurnoUseCase", () => {
  it("traduce los eventos a acciones en orden y no consulta el historial", async () => {
    const { ejecutar, acciones, cargarHistorial } = preparar({
      eventos: [
        { tipo: "aceptado", mensajeId: "m-1" },
        { tipo: "token", texto: "Hola" },
        { tipo: "bloque", bloque: { id: "b", tipo: "CARRITO" } },
        { tipo: "fin", mensajeId: "m-2" },
      ],
    });
    await ejecutar("  hola  ");
    expect(tipos(acciones)).toEqual(["usuarioAgregado", "aceptado", "token", "bloque", "fin"]);
    const [usuario, aceptado, , , fin] = acciones;
    expect(usuario).toMatchObject({ mensaje: { rol: "user", texto: "hola" } });
    const idTemporal = (usuario as { mensaje: Mensaje }).mensaje.id;
    expect(idTemporal).toMatch(/^u-\d+$/);
    expect(aceptado).toEqual({ tipo: "aceptado", idTemporal, mensajeId: "m-1" });
    expect(fin).toMatchObject({ mensajeId: "m-2", conversacionId: "c-1" });
    expect(cargarHistorial).not.toHaveBeenCalled();
  });

  it("traduce un turno degradado", async () => {
    const { ejecutar, acciones } = preparar({
      eventos: [
        { tipo: "aceptado", mensajeId: "m-1" },
        { tipo: "token", texto: "x" },
        { tipo: "degradado", motivo: "timeout" },
        { tipo: "bloque", bloque: { id: "b", tipo: "ACCIONES_RAPIDAS" } },
        { tipo: "fin", mensajeId: "m-2" },
      ],
    });
    await ejecutar();
    expect(tipos(acciones)).toEqual([
      "usuarioAgregado",
      "aceptado",
      "token",
      "degradado",
      "bloque",
      "fin",
    ]);
  });

  it.each([
    [400, "VALIDACION"],
    [404, "RECURSO_NO_ENCONTRADO"],
    [501, "NO_IMPLEMENTADO"],
  ])("fallo previo %i: despacha falloPrevio con status y código", async (status, code) => {
    const { ejecutar, acciones, cargarHistorial } = preparar({
      falla: new ChatStreamError(status, code),
    });
    await ejecutar();
    expect(tipos(acciones)).toEqual(["usuarioAgregado", "falloPrevio"]);
    expect(acciones[1]).toMatchObject({ code, status });
    expect(cargarHistorial).not.toHaveBeenCalled();
  });

  it("abort: termina en silencio sin acciones de fallo", async () => {
    const controlador = new AbortController();
    const abort = new DOMException("abortado", "AbortError");
    const { ejecutar, acciones, cargarHistorial } = preparar({ falla: abort });
    controlador.abort();
    await expect(ejecutar("hola", controlador.signal)).resolves.toBeUndefined();
    expect(tipos(acciones)).toEqual(["usuarioAgregado"]);
    expect(cargarHistorial).not.toHaveBeenCalled();
  });

  it("error inesperado: despacha ERROR_RED", async () => {
    const { ejecutar, acciones } = preparar({ falla: new TypeError("Failed to fetch") });
    await ejecutar();
    expect(acciones[1]).toEqual({ tipo: "error", code: "ERROR_RED" });
  });

  it("evento error: no consulta el historial", async () => {
    const { ejecutar, acciones, cargarHistorial } = preparar({
      eventos: [
        { tipo: "aceptado", mensajeId: "m-1" },
        { tipo: "error", code: "ERROR_INTERNO" },
      ],
    });
    await ejecutar();
    expect(tipos(acciones)).toEqual(["usuarioAgregado", "aceptado", "error"]);
    expect(cargarHistorial).not.toHaveBeenCalled();
  });

  it("sin fin y con respuesta del bot en el historial: lo reemplaza, una sola consulta", async () => {
    const historial = [msg("m-1", "user"), msg("m-2", "bot")];
    const { ejecutar, acciones, cargarHistorial } = preparar({
      eventos: [{ tipo: "aceptado", mensajeId: "m-1" }],
      historial,
    });
    await ejecutar();
    expect(cargarHistorial).toHaveBeenCalledTimes(1);
    expect(acciones.at(-1)).toEqual({ tipo: "historialCargado", mensajes: historial });
    expect(tipos(acciones)).not.toContain("incompleto");
  });

  it("sin fin y sin respuesta del bot: marca incompleto", async () => {
    const { ejecutar, acciones, cargarHistorial } = preparar({
      eventos: [{ tipo: "aceptado", mensajeId: "m-1" }],
      historial: [msg("m-0", "bot"), msg("m-1", "user")],
    });
    await ejecutar();
    expect(cargarHistorial).toHaveBeenCalledTimes(1);
    expect(acciones.at(-1)).toEqual({ tipo: "incompleto" });
  });

  it("sin fin y la consulta falla: marca incompleto sin reintentar", async () => {
    const { ejecutar, acciones, cargarHistorial } = preparar({
      eventos: [{ tipo: "aceptado", mensajeId: "m-1" }],
      historial: new Error("red"),
    });
    await ejecutar();
    expect(cargarHistorial).toHaveBeenCalledTimes(1);
    expect(acciones.at(-1)).toEqual({ tipo: "incompleto" });
  });

  it("rechaza texto vacío sin despachar ni llamar al stream", async () => {
    const { ejecutar, acciones, enviarMensajeStream } = preparar({});
    await expect(ejecutar("   ")).rejects.toThrow("Mensaje vacío");
    expect(acciones).toEqual([]);
    expect(enviarMensajeStream).not.toHaveBeenCalled();
  });
});
