import { describe, it, expect, vi } from "vitest";
import { agregarCarritoAnonimoUseCase } from "@/application/use_cases/agregarCarritoAnonimoUseCase";

const vieja = "0f9a1c2e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";
const nueva = "11111111-2222-4333-8444-555555555555";
const noEncontrado = { response: { status: 404, data: { code: "RECURSO_NO_ENCONTRADO" } } };

describe("agregar al carrito anónimo", () => {
  it("limpia una conversación guardada inválida, crea otra y reintenta una vez", async () => {
    const agregar = vi.fn().mockRejectedValueOnce(noEncontrado).mockResolvedValueOnce(undefined);
    const limpiarConversacion = vi.fn();
    const crearConversacion = vi.fn().mockResolvedValue(nueva);

    await expect(agregarCarritoAnonimoUseCase({
      conversacionGuardada: vieja,
      crearConversacion,
      limpiarConversacion,
      agregar,
    })).resolves.toBe(nueva);
    expect(agregar.mock.calls).toEqual([[vieja], [nueva]]);
    expect(limpiarConversacion).toHaveBeenCalledOnce();
    expect(crearConversacion).toHaveBeenCalledOnce();
  });

  it("propaga el error del único reintento", async () => {
    const errorFinal = new Error("Sin conexión");
    const agregar = vi.fn().mockRejectedValueOnce(noEncontrado).mockRejectedValueOnce(errorFinal);
    await expect(agregarCarritoAnonimoUseCase({
      conversacionGuardada: vieja,
      crearConversacion: vi.fn().mockResolvedValue(nueva),
      limpiarConversacion: vi.fn(),
      agregar,
    })).rejects.toBe(errorFinal);
    expect(agregar).toHaveBeenCalledTimes(2);
  });
});
