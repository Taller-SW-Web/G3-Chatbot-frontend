import { describe, it, expect, vi } from "vitest";
import { actualizarCantidadCarritoUseCase } from "@/application/use_cases/actualizarCantidadCarritoUseCase";
import { quitarDelCarritoUseCase } from "@/application/use_cases/quitarDelCarritoUseCase";
import { agregarProductoAlCarritoUseCase } from "@/application/use_cases/agregarProductoAlCarritoUseCase";
import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

const api = {
  actualizarCantidadCarrito: vi.fn(),
  eliminarLineaCarrito: vi.fn(),
  agregarAlCarrito: vi.fn(),
} as unknown as ChatbotApiPort;

describe("casos de uso del carrito (SPEC-11)", () => {
  it("actualizar valida cantidad 0-10 e itemId", async () => {
    await expect(actualizarCantidadCarritoUseCase(api, { itemId: " ", cantidad: 1 })).rejects.toThrow();
    await expect(actualizarCantidadCarritoUseCase(api, { itemId: "l1", cantidad: 11 })).rejects.toThrow();
    await expect(actualizarCantidadCarritoUseCase(api, { itemId: "l1", cantidad: -1 })).rejects.toThrow();
  });

  it("quitar exige itemId", async () => {
    await expect(quitarDelCarritoUseCase(api, { itemId: "  " })).rejects.toThrow();
  });

  it("agregar valida sku y cantidad 1-10", async () => {
    await expect(agregarProductoAlCarritoUseCase(api, { sku: "  ", cantidad: 1 })).rejects.toThrow();
    await expect(agregarProductoAlCarritoUseCase(api, { sku: "X", cantidad: 0 })).rejects.toThrow();
    await expect(agregarProductoAlCarritoUseCase(api, { sku: "X", cantidad: 11 })).rejects.toThrow();
  });
});
