import { describe, it, expect, vi } from "vitest";
import { buscarProductosUseCase } from "@/application/use_cases/buscarProductosUseCase";
import { verDetalleProductoUseCase } from "@/application/use_cases/verDetalleProductoUseCase";
import { consultarDisponibilidadUseCase } from "@/application/use_cases/consultarDisponibilidadUseCase";
import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";
import { messiClub } from "../fixtures/messiClub";

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
    const r = await buscarProductosUseCase(api, { q: "  Nike ", tamanio: 99, soloOfertas: true });
    expect(llamadas.buscar[0]).toMatchObject({ q: "Nike", pagina: 1, tamanio: 10, soloOfertas: true });
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

  it("REST conserva single_sku y partial y descarta filas sin identidad", async () => {
    const { api } = apiCon({
      buscarProductos: vi.fn().mockResolvedValue({ items: [null, {}, messiClub], total: 20, partial: true }),
      verDetalleProducto: vi.fn().mockResolvedValue(messiClub),
    });
    const page = await buscarProductosUseCase(api, {});
    expect(page.partial).toBe(true);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].sku).toBe(messiClub.single_sku);
    expect((await verDetalleProductoUseCase(api, messiClub.product_id)).singleSku).toBe(messiClub.single_sku);
  });

  it.each([null, {}, { product_id: " " }, { product_id: "otro" }])("no inventa un detalle para el payload %j", async (payload) => {
    const { api } = apiCon({ verDetalleProducto: vi.fn().mockResolvedValue(payload) });
    await expect(verDetalleProductoUseCase(api, messiClub.product_id)).rejects.toThrow("Detalle de producto inválido");
  });

  it.each([[], null, [{ sku: "OTRO", status: "DISPONIBLE" }], [{ sku: messiClub.single_sku }], [{ sku: messiClub.single_sku, status: "DESCONOCIDO" }]])("no toma la disponibilidad de otro SKU ni un payload incompleto: %j", async (rows) => {
    const { api } = apiCon({ consultarDisponibilidad: vi.fn().mockResolvedValue(rows) });
    await expect(consultarDisponibilidadUseCase(api, { sku: messiClub.single_sku })).rejects.toThrow("Sin respuesta de disponibilidad");
  });
});
