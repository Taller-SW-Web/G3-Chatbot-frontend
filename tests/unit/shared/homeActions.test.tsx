// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useHomeActions } from "@/app/_home/useHomeActions";
import { useChatStore } from "@/shared/auth/chatStore";
import type { CatalogCardItem } from "@/modules/mod-catalog/domain/entities/CatalogoUI";

const h = vi.hoisted(() => ({
  agregar: vi.fn(),
  crear: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: h.push }) }));
vi.mock("@/shared/di/container", () => ({ container: { carrito: {}, chat: {} } }));
vi.mock("@/modules/mod-cart/application/agregarProductoAlCarritoUseCase", () => ({ agregarProductoAlCarritoUseCase: h.agregar }));
vi.mock("@/modules/mod-chat/application/crearConversacionUseCase", () => ({ crearConversacionUseCase: h.crear }));

const producto: CatalogCardItem = {
  product_id: "p1",
  name: "Zapatilla Volta",
  brand: "Inka",
  price: 299,
  image: null,
  shortDescription: "Para asfalto",
  hasVariants: true,
  variants: [{ sku: "SKU-42-NEGRO", talla: "42", color: "negro" }],
  availability: "DISPONIBLE",
};

const sel = { sku: "SKU-42-NEGRO", talla: "42", color: "negro" };

function renderAcciones() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return renderHook(() => useHomeActions(), { wrapper });
}

function errorCon(code: string, status = 409, extra: Record<string, unknown> = {}) {
  return { response: { status, data: { code, ...extra } } };
}

beforeEach(() => {
  vi.clearAllMocks();
  useChatStore.setState({
    cliente: null,
    ultimaConversacionId: null,
    primerMensaje: null,
    accionPendiente: null,
    authOpen: false,
  });
  h.agregar.mockResolvedValue({ ok: true });
  h.crear.mockResolvedValue({ conversacionId: "nueva" });
});

afterEach(cleanup);

describe("useHomeActions (composición catálogo + carrito + chat)", () => {
  it("con sesión agrega al carrito sin abrir conversación", async () => {
    useChatStore.setState({ cliente: { id: "u1", correo: "ana@ejemplo.pe" } as never });
    const { result } = renderAcciones();

    const respuesta = await result.current.onAgregar({ item: producto, sel });

    expect(h.agregar).toHaveBeenCalledWith({}, {
      sku: "SKU-42-NEGRO",
      cantidad: 1,
      product_id: "p1",
      talla: "42",
      color: "negro",
      conversacionId: undefined,
    });
    expect(h.crear).not.toHaveBeenCalled();
    expect(respuesta).toEqual({ ok: true, mensaje: "Zapatilla Volta se agregó a tu carrito." });
  });

  it("en anónimo crea la conversación, agrega en ella y la guarda", async () => {
    const { result } = renderAcciones();

    await result.current.onAgregar({ item: producto, sel });

    expect(h.crear).toHaveBeenCalledTimes(1);
    expect(h.agregar).toHaveBeenCalledWith({}, expect.objectContaining({ conversacionId: "nueva" }));
    expect(useChatStore.getState().ultimaConversacionId).toBe("nueva");
    expect(h.push).not.toHaveBeenCalled();
  });

  it("reutiliza la conversación creada en el mismo intento", async () => {
    const { result } = renderAcciones();

    await result.current.onAgregar({ item: producto, sel });
    expect(h.crear).toHaveBeenCalledTimes(1);

    await result.current.onAgregar({ item: producto, sel });
    expect(h.crear).toHaveBeenCalledTimes(1);
    expect(h.agregar).toHaveBeenLastCalledWith({}, expect.objectContaining({ conversacionId: "nueva" }));
  });

  it("traduce VARIANTE_REQUERIDA y explica qué falta", async () => {
    h.agregar.mockRejectedValue(errorCon("VARIANTE_REQUERIDA", 409, { faltantes: ["talla", "color"] }));
    useChatStore.setState({ cliente: { id: "u1", correo: "ana@ejemplo.pe" } as never });
    const { result } = renderAcciones();

    await expect(result.current.onAgregar({ item: producto, sel }))
      .resolves.toEqual({ ok: false, mensaje: "Elige talla y color antes de agregar." });
  });

  it("traduce otros errores del carrito", async () => {
    h.agregar.mockRejectedValue(errorCon("STOCK_INSUFICIENTE"));
    useChatStore.setState({ cliente: { id: "u1", correo: "ana@ejemplo.pe" } as never });
    const { result } = renderAcciones();

    const respuesta = await result.current.onAgregar({ item: producto, sel });
    expect(respuesta.ok).toBe(false);
    expect(respuesta.mensaje).toMatch(/No hay stock suficiente/);
  });

  it("sin sku devuelve el mensaje genérico y no llama al carrito", async () => {
    const { result } = renderAcciones();

    await expect(result.current.onAgregar({ item: producto, sel: { ...sel, sku: null } }))
      .resolves.toEqual({ ok: false, mensaje: "No pudimos completar la acción. Intenta de nuevo." });
    expect(h.agregar).not.toHaveBeenCalled();
  });

  it("abre el chat: crea la conversación, deja el primer mensaje y navega", async () => {
    const { result } = renderAcciones();

    await result.current.onAbrirChat("Quiero zapatillas");

    expect(h.crear).toHaveBeenCalledWith({});
    expect(useChatStore.getState().primerMensaje).toBe("Quiero zapatillas");
    expect(h.push).toHaveBeenCalledWith("/chat/nueva");
  });

  it("propaga el fallo al crear la conversación para que la home ofrezca reintentar", async () => {
    h.crear.mockRejectedValueOnce(new Error("caído"));
    const { result } = renderAcciones();

    await expect(result.current.onAbrirChat("Hola")).rejects.toThrow("caído");
    expect(h.push).not.toHaveBeenCalled();
  });
});
