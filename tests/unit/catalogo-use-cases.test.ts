import { describe, it, expect, vi } from "vitest";
import { buscarProductosUseCase } from "@/application/use_cases/buscarProductosUseCase";
import { verDetalleProductoUseCase } from "@/application/use_cases/verDetalleProductoUseCase";
import { consultarDisponibilidadUseCase } from "@/application/use_cases/consultarDisponibilidadUseCase";
import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

function apiCon(overrides: Partial<ChatbotApiPort> = {}): {
  api: ChatbotApiPort;
  llamadas: Record<string, unknown[]>;
} {
  const llamadas: Record<string, unknown[]> = {};
  const api = {
    buscarProductos: vi.fn(async (input: unknown) => {
      (llamadas.buscar ??= []).push(input);
      return { items: [{ product_id: "prod-001", name: "Nike", price: 10, availability: "DISPONIBLE" }], total: 1 };
    }),
    verDetalleProducto: vi.fn(async (id: string) => {
      (llamadas.detalle ??= []).push(id);
      return { product_id: id, name: "Nike", variants: [] };
    }),
    consultarDisponibilidad: vi.fn(async (sku: string) => {
      (llamadas.disponibilidad ??= []).push(sku);
      return [{ sku, status: "DISPONIBLE" }];
    }),
  } as unknown as ChatbotApiPort;
  return { api: { ...api, ...overrides } as ChatbotApiPort, llamadas };
}

describe("casos de uso de catálogo (SPEC-06, SPEC-09, SPEC-10)", () => {
  it("buscar normaliza paginación y mapea a tarjetas", async () => {
    const { api, llamadas } = apiCon();
    const r = await buscarProductosUseCase(api, { q: "  Nike ", tamanio: 99 });
    expect(llamadas.buscar[0]).toMatchObject({ q: "Nike", pagina: 1, tamanio: 10 });
    expect(r.items[0]).toMatchObject({ product_id: "prod-001" });
    expect(r.total).toBe(1);
  });

  it("detalle exige id y mapea variantes", async () => {
    const { api } = apiCon();
    await expect(verDetalleProductoUseCase(api, "   ")).rejects.toThrow();
    const d = await verDetalleProductoUseCase(api, "prod-001");
    expect(d.product_id).toBe("prod-001");
  });

  it("disponibilidad exige sku y devuelve estado", async () => {
    const { api, llamadas } = apiCon();
    const r = await consultarDisponibilidadUseCase(api, { sku: " A ", cantidad: 2 });
    expect(llamadas.disponibilidad[0]).toBe("A");
    expect(r.status).toBe("DISPONIBLE");
    await expect(consultarDisponibilidadUseCase(api, { sku: " " })).rejects.toThrow();
  });
});
