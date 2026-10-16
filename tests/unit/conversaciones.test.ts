import { describe, it, expect, vi } from "vitest";
import {
  CONVERSACIONES_POR_PAGINA,
  type ChatbotApiPort,
  type ConversacionResumen,
} from "@/ports/outbound/ChatbotApiPort";
import {
  listarConversacionesUseCase,
  siguientePaginaConversaciones,
} from "@/application/use_cases/listarConversacionesUseCase";
import {
  buscarConversacionesUseCase,
  BUSQUEDA_MAX_CARACTERES,
} from "@/application/use_cases/buscarConversacionesUseCase";
import { crearConversacionUseCase } from "@/application/use_cases/crearConversacionUseCase";

const fila = (id: string): ConversacionResumen => ({
  id,
  titulo: `chat ${id}`,
  preview: "",
  ultimoMensajeEn: "2026-10-16T00:00:00Z",
});

const pagina = (n: number) => Array.from({ length: n }, (_, i) => fila(String(i)));

function apiFalsa() {
  return {
    crearConversacion: vi.fn().mockResolvedValue({ conversacionId: "c-1" }),
    listarConversaciones: vi.fn().mockResolvedValue([]),
    buscarConversaciones: vi.fn().mockResolvedValue([]),
  } as unknown as ChatbotApiPort & Record<string, ReturnType<typeof vi.fn>>;
}

describe("barra lateral: conversaciones (SPEC-05 Req. 1)", () => {
  it("pide la página siguiente solo si la última vino completa", () => {
    const llena = pagina(CONVERSACIONES_POR_PAGINA);
    expect(siguientePaginaConversaciones(llena, [llena])).toBe(2);
    expect(siguientePaginaConversaciones(pagina(3), [llena, pagina(3)])).toBeUndefined();
    expect(siguientePaginaConversaciones([], [[]])).toBeUndefined();
  });

  it("lista por página", async () => {
    const api = apiFalsa();
    await listarConversacionesUseCase(api, 2);
    expect(api.listarConversaciones).toHaveBeenCalledWith(2);
  });

  it("no consulta /buscar con un término vacío", async () => {
    const api = apiFalsa();
    expect(await buscarConversacionesUseCase(api, "   ")).toBeNull();
    expect(api.buscarConversaciones).not.toHaveBeenCalled();
  });

  it("busca con el término recortado y dentro del máximo del backend", async () => {
    const api = apiFalsa();
    await buscarConversacionesUseCase(api, "  zapatillas  ");
    expect(api.buscarConversaciones).toHaveBeenCalledWith("zapatillas", 1);
    await buscarConversacionesUseCase(api, "a".repeat(150), 3);
    expect(api.buscarConversaciones).toHaveBeenLastCalledWith("a".repeat(BUSQUEDA_MAX_CARACTERES), 3);
  });

  it("crea una conversación vacía para Nuevo chat", async () => {
    const api = apiFalsa();
    expect(await crearConversacionUseCase(api)).toEqual({ conversacionId: "c-1" });
  });
});
