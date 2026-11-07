// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useCarrito } from "@/application/hooks/useCarrito";
import { useChatStore } from "@/application/state/chatStore";

const listarCarrito = vi.hoisted(() => vi.fn());
vi.mock("@/infrastructure/di/container", () => ({ container: { api: { listarCarrito } } }));

const conversacion = "0f9a1c2e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";
const carritoVacio = { lineas: [], subtotal: 0, descuentos: [], costoEnvio: null, total: 0, avisos: [] };

function renderCarrito() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return renderHook(() => useCarrito(), { wrapper });
}

describe("useCarrito", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChatStore.setState({ cliente: null, ultimaConversacionId: conversacion });
  });
  afterEach(() => cleanup());

  it("consulta el carrito del cliente sin conversacionId", async () => {
    useChatStore.setState({ cliente: { id: "cli-1", nombreCompleto: "Ana Díaz", correo: "ana@test.pe", celularVerificado: true } });
    listarCarrito.mockResolvedValue(carritoVacio);
    renderCarrito();
    await waitFor(() => expect(listarCarrito).toHaveBeenCalledWith(undefined));
  });

  it("borra una conversación anónima obsoleta cuando GET responde 404", async () => {
    listarCarrito.mockRejectedValueOnce({ response: { status: 404, data: { code: "RECURSO_NO_ENCONTRADO" } } })
      .mockResolvedValue(carritoVacio);
    renderCarrito();
    await waitFor(() => expect(useChatStore.getState().ultimaConversacionId).toBeNull());
    expect(useChatStore.getState().carrito.count).toBe(0);
    expect(listarCarrito).toHaveBeenCalledWith(conversacion);
  });
});
