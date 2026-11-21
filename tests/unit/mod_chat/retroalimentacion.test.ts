import { describe, expect, it, vi } from "vitest";
import { enviarReaccionUseCase } from "@/modules/mod-chat/application/enviarReaccionUseCase";
import {
  enviarSugerenciaUseCase,
  mensajeSugerencia,
} from "@/modules/mod-chat/application/enviarSugerenciaUseCase";
import type { ChatApiPort } from "@/modules/mod-chat/ports/chatApiPort";

function api(overrides: Partial<ChatApiPort> = {}): ChatApiPort {
  return {
    crearConversacion: vi.fn(),
    cargarHistorial: vi.fn(),
    ejecutarAccion: vi.fn(),
    listarConversaciones: vi.fn(),
    buscarConversaciones: vi.fn(),
    subirAdjunto: vi.fn(),
    eliminarAdjunto: vi.fn(),
    obtenerUrlAdjunto: vi.fn(),
    enviarReaccion: vi.fn(),
    enviarSugerencia: vi.fn(),
    ...overrides,
  } as ChatApiPort;
}

describe("retroalimentación (SPEC-24)", () => {
  it("reintenta una vez la reacción y nunca lanza", async () => {
    const enviarReaccion = vi.fn().mockRejectedValueOnce(new Error("sin red")).mockResolvedValueOnce(undefined);
    await expect(enviarReaccionUseCase(api({ enviarReaccion }), "m-1", "POSITIVE")).resolves.toBeUndefined();
    expect(enviarReaccion).toHaveBeenCalledTimes(2);
  });

  it("se queda en silencio si los dos intentos fallan", async () => {
    const enviarReaccion = vi.fn().mockRejectedValue(new Error("sin red"));
    await expect(enviarReaccionUseCase(api({ enviarReaccion }), "m-1", "NEGATIVE")).resolves.toBeUndefined();
    expect(enviarReaccion).toHaveBeenCalledTimes(2);
  });

  it("ignora mensajes sin id o reacciones fuera del contrato", async () => {
    const enviarReaccion = vi.fn();
    await enviarReaccionUseCase(api({ enviarReaccion }), "", "POSITIVE");
    await enviarReaccionUseCase(api({ enviarReaccion }), "m-1", "OTRA" as never);
    expect(enviarReaccion).not.toHaveBeenCalled();
  });

  it("valida y recorta el formulario de sugerencia antes de enviarlo", async () => {
    const enviarSugerencia = vi.fn().mockResolvedValue({ codigoSeguimiento: "SUG-1" });
    const resultado = await enviarSugerenciaUseCase(api({ enviarSugerencia }), {
      tipo: "SUGERENCIA",
      titulo: "  Filtro por talla  ",
      descripcion: "  Quiero filtrar por talla 42  ",
      correoContacto: " ana@ejemplo.pe ",
    });

    expect(resultado.codigoSeguimiento).toBe("SUG-1");
    expect(enviarSugerencia).toHaveBeenCalledWith({
      tipo: "SUGERENCIA",
      titulo: "Filtro por talla",
      descripcion: "Quiero filtrar por talla 42",
      correoContacto: "ana@ejemplo.pe",
      captura: undefined,
    });
  });

  it("rechaza título o descripción demasiado cortos sin llamar al backend", async () => {
    const enviarSugerencia = vi.fn();
    await expect(
      enviarSugerenciaUseCase(api({ enviarSugerencia }), {
        tipo: "BUG",
        titulo: "ab",
        descripcion: "suficiente",
        correoContacto: "a@b.pe",
      })
    ).rejects.toThrow(/título/);
    await expect(
      enviarSugerenciaUseCase(api({ enviarSugerencia }), {
        tipo: "BUG",
        titulo: "Título válido",
        descripcion: "corto",
        correoContacto: "a@b.pe",
      })
    ).rejects.toThrow(/descripción/);
    expect(enviarSugerencia).not.toHaveBeenCalled();
  });

  it("traduce los errores del backend a mensajes humanos", () => {
    expect(
      mensajeSugerencia({ response: { status: 429, data: { code: "DEMASIADAS_SOLICITUDES" } } })
    ).toBe("Ya enviaste varias sugerencias, intenta en un rato");
    expect(mensajeSugerencia({ response: { status: 503, data: { code: "SERVICIO_NO_DISPONIBLE" } } })).toBe(
      "No pudimos enviar tu sugerencia, intenta de nuevo"
    );
  });
});
