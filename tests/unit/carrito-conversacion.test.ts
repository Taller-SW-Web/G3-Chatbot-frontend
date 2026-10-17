import { describe, it, expect } from "vitest";
import { conversacionParaCarrito } from "@/domain/utils/carrito";
import { mensajeCarrito } from "@/application/errors/carritoMensajes";

describe("carrito: id de conversación anónimo (SPEC-11)", () => {
  it("solo acepta UUIDs reales; descarta slugs mock", () => {
    const uuid = "0f9a1c2e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";
    expect(conversacionParaCarrito(uuid)).toBe(uuid);
    expect(conversacionParaCarrito(uuid.toUpperCase())).toBe(uuid.toUpperCase());
    expect(conversacionParaCarrito("talla-42")).toBeUndefined();
    expect(conversacionParaCarrito("")).toBeUndefined();
    expect(conversacionParaCarrito(null)).toBeUndefined();
    expect(conversacionParaCarrito(undefined)).toBeUndefined();
  });
});

describe("carrito: mensajes por code (nunca por texto libre)", () => {
  it("cubre los códigos del contrato y un genérico", () => {
    expect(mensajeCarrito("SKU_AGOTADO")).toMatch(/agot/i);
    expect(mensajeCarrito("CONFLICTO")).toMatch(/cambió/i);
    expect(mensajeCarrito("LINEA_NO_ENCONTRADA")).toMatch(/línea/i);
    expect(mensajeCarrito("VARIANTE_REQUERIDA")).toMatch(/talla/i);
    expect(mensajeCarrito("RECURSO_NO_ENCONTRADO")).toMatch(/conversación/i);
    expect(mensajeCarrito(null)).toMatch(/intenta/i);
  });
});
