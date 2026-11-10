// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useChat } from "@/adapters/inbound/hooks/useChat";
import type { Mensaje } from "@/domain/entities/Mensaje";

const h = vi.hoisted(() => ({ cargar: vi.fn(), ejecutar: vi.fn() }));

vi.mock("@/infrastructure/di/container", () => ({ container: { api: {}, stream: {} } }));
vi.mock("@/application/use_cases/cargarHistorialUseCase", () => ({
  cargarHistorialUseCase: h.cargar,
}));
vi.mock("@/application/use_cases/ejecutarTurnoUseCase", () => ({
  ejecutarTurnoUseCase: h.ejecutar,
}));

function mensaje(id: string, conversacionId = "c1", texto = "Hola"): Mensaje {
  return { id, conversacionId, rol: "bot", texto, creadoEn: "2026-11-09T00:00:00Z" };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.cargar.mockResolvedValue([mensaje("m1")]);
  h.ejecutar.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe("useChat", () => {
  it("carga el historial y lo deja listo", async () => {
    const { result } = renderHook(() => useChat("c1"));

    expect(result.current.estado).toBe("cargando");
    await waitFor(() => expect(result.current.historialCargado).toBe(true));
    expect(result.current.mensajes.map((m) => m.id)).toEqual(["m1"]);
    expect(result.current.estado).toBe("inactivo");
    expect(h.cargar).toHaveBeenCalledWith({}, "c1");
  });

  it("expone ERROR_HISTORIAL cuando el historial no se puede cargar", async () => {
    h.cargar.mockRejectedValue(new Error("sin red"));
    const { result } = renderHook(() => useChat("c1"));

    await waitFor(() => expect(result.current.error?.code).toBe("ERROR_HISTORIAL"));
    expect(result.current.estado).toBe("error");
    expect(result.current.historialCargado).toBe(false);
  });

  it("no envía mientras el historial sigue cargando", async () => {
    let resolver!: (m: Mensaje[]) => void;
    h.cargar.mockReturnValue(new Promise<Mensaje[]>((r) => { resolver = r; }));
    const { result } = renderHook(() => useChat("c1"));

    await act(async () => { await result.current.enviar("hola"); });
    expect(h.ejecutar).not.toHaveBeenCalled();

    await act(async () => { resolver([mensaje("m1")]); });
    await waitFor(() => expect(result.current.historialCargado).toBe(true));
  });

  it("evita turnos solapados y se recupera al cerrar el turno", async () => {
    let resolver!: () => void;
    const pendiente = new Promise<void>((r) => { resolver = r; });
    h.ejecutar.mockReturnValueOnce(pendiente);
    const { result } = renderHook(() => useChat("c1"));
    await waitFor(() => expect(result.current.historialCargado).toBe(true));

    let primero!: Promise<void>;
    act(() => { primero = result.current.enviar("hola"); });
    const segundo = result.current.enviar("otra vez");

    expect(h.ejecutar).toHaveBeenCalledTimes(1);
    expect(result.current.ultimoTexto).toBe("hola");
    expect(h.ejecutar).toHaveBeenCalledWith(expect.objectContaining({
      conversacionId: "c1",
      texto: "hola",
    }));

    // Al resolverse el turno en curso, el hook vuelve a aceptar envíos.
    await act(async () => { resolver(); await primero; await segundo; });
    expect(h.ejecutar).toHaveBeenCalledTimes(1);

    h.ejecutar.mockResolvedValueOnce(undefined);
    await act(async () => { await result.current.enviar("tercera"); });
    expect(h.ejecutar).toHaveBeenCalledTimes(2);
    expect(h.ejecutar).toHaveBeenLastCalledWith(expect.objectContaining({ texto: "tercera" }));
  });

  it("reenvía el último texto con reintentar", async () => {
    const { result } = renderHook(() => useChat("c1"));
    await waitFor(() => expect(result.current.historialCargado).toBe(true));

    await act(async () => { await result.current.enviar("hola"); });
    expect(h.ejecutar).toHaveBeenCalledTimes(1);

    await act(async () => { await result.current.reintentar(); });
    expect(h.ejecutar).toHaveBeenCalledTimes(2);
    expect(h.ejecutar).toHaveBeenLastCalledWith(expect.objectContaining({ texto: "hola" }));
  });

  it("reintentar sin un texto previo no dispara ningún turno", async () => {
    const { result } = renderHook(() => useChat("c1"));
    await waitFor(() => expect(result.current.historialCargado).toBe(true));

    await act(async () => { await result.current.reintentar(); });
    expect(h.ejecutar).not.toHaveBeenCalled();
  });

  it("recargar vuelve a pedir el historial", async () => {
    const { result } = renderHook(() => useChat("c1"));
    await waitFor(() => expect(h.cargar).toHaveBeenCalledTimes(1));

    act(() => { result.current.recargar(); });
    await waitFor(() => expect(h.cargar).toHaveBeenCalledTimes(2));
  });

  it("recargarSilencioso actualiza los mensajes sin vaciar la conversación", async () => {
    const { result } = renderHook(() => useChat("c1"));
    await waitFor(() => expect(result.current.mensajes).toHaveLength(1));

    h.cargar.mockResolvedValue([mensaje("m1"), mensaje("m2")]);
    await act(async () => { await result.current.recargarSilencioso(); });

    expect(result.current.mensajes.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(result.current.estado).toBe("inactivo");
  });

  it("descarta el historial de la conversación anterior si llega tarde", async () => {
    let resolverC1!: (m: Mensaje[]) => void;
    h.cargar.mockImplementationOnce(() => new Promise<Mensaje[]>((r) => { resolverC1 = r; }));
    const { result, rerender } = renderHook(({ id }: { id: string }) => useChat(id), {
      initialProps: { id: "c1" },
    });

    h.cargar.mockResolvedValue([mensaje("m2", "c2")]);
    rerender({ id: "c2" });
    await waitFor(() => expect(result.current.mensajes.map((m) => m.id)).toEqual(["m2"]));

    await act(async () => { resolverC1([mensaje("tarde", "c1")]); });
    expect(result.current.mensajes.map((m) => m.id)).toEqual(["m2"]);
  });
});
