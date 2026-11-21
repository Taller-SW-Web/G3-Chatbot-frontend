import { describe, it, expect, vi } from "vitest";
import { actualizarCantidadCarritoUseCase } from "@/modules/mod-cart/application/actualizarCantidadCarritoUseCase";
import { quitarDelCarritoUseCase } from "@/modules/mod-cart/application/quitarDelCarritoUseCase";
import { agregarProductoAlCarritoUseCase } from "@/modules/mod-cart/application/agregarProductoAlCarritoUseCase";
import type { CarritoPort } from "@/modules/mod-cart/ports/carritoPort";

const api = {
  actualizarCantidadCarrito: vi.fn(),
  eliminarLineaCarrito: vi.fn(),
  agregarAlCarrito: vi.fn(),
} as unknown as CarritoPort;

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
