// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { CartPage } from "@/adapters/inbound/pages/CartPage";
import { useChatStore } from "@/application/state/chatStore";

const h = vi.hoisted(() => {
  const CONV_STORE = "0f9a1c2e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";
  const CONV_PROP = "11111111-2222-4333-8444-555555555555";
  const CARRITO = {
    lineas: [
      {
        item_id: "l1",
        sku: "SKU-1",
        nombre: "Zapatilla",
        variante: "42 / Negro",
        cantidad: 1,
        precio: 100,
        disponible: true,
      },
    ],
    subtotal: 100,
    descuentos: [],
    costoEnvio: null,
    total: 100,
    avisos: [],
    promociones_ok: true,
  };
  return {
    CONV_STORE,
    CONV_PROP,
    CARRITO,
    actualizar: vi.fn(),
    quitar: vi.fn(),
    vaciar: vi.fn(),
    agregar: vi.fn(),
  };
});

vi.mock("@/application/use_cases/actualizarCantidadCarritoUseCase", () => ({
  actualizarCantidadCarritoUseCase: h.actualizar,
}));
vi.mock("@/application/use_cases/quitarDelCarritoUseCase", () => ({
  quitarDelCarritoUseCase: h.quitar,
}));
vi.mock("@/application/use_cases/vaciarCarritoUseCase", () => ({
  vaciarCarritoUseCase: h.vaciar,
}));
vi.mock("@/application/use_cases/agregarProductoAlCarritoUseCase", () => ({
  agregarProductoAlCarritoUseCase: h.agregar,
}));
vi.mock("@/infrastructure/di/container", () => ({ container: { api: {} } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
// El GET resuelve la conversación del store; la página NO recibe la prop.
vi.mock("@/application/hooks/useCarrito", () => ({
  useCarrito: () => ({
    query: { data: h.CARRITO, isPending: false, isError: false, refetch: vi.fn() },
    queryKey: ["carrito", "anonimo", "cliente"],
    conversacion: h.CONV_STORE,
    dueno: "anonimo",
  }),
}));

function renderCart(props: { conversacionId?: string } = {}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  return render(<CartPage {...props} />, { wrapper: Wrapper });
}

describe("CartPage: mutaciones del carrito anónimo (SPEC-11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.actualizar.mockResolvedValue(h.CARRITO);
    h.quitar.mockResolvedValue({ mensaje: "ok" });
    h.vaciar.mockResolvedValue({ mensaje: "ok" });
    h.agregar.mockResolvedValue({ ok: true });
    useChatStore.setState({ cliente: null, ultimaConversacionId: null });
  });

  afterEach(() => cleanup());

  it("sin prop, '+' usa la conversación que resolvió el GET", async () => {
    renderCart();
    fireEvent.click(
      screen.getByRole("button", { name: /Aumentar cantidad de Zapatilla/i })
    );
    await waitFor(() => expect(h.actualizar).toHaveBeenCalled());
    expect(h.actualizar).toHaveBeenCalledWith(expect.anything(), {
      itemId: "l1",
      cantidad: 2,
      conversacionId: h.CONV_STORE,
    });
  });

  it("sin prop, quitar y deshacer usan la misma conversación", async () => {
    renderCart();
    fireEvent.click(screen.getByRole("button", { name: /Quitar Zapatilla/i }));
    await waitFor(() =>
      expect(h.quitar).toHaveBeenCalledWith(expect.anything(), {
        itemId: "l1",
        conversacionId: h.CONV_STORE,
      })
    );
    fireEvent.click(await screen.findByTestId("btn-deshacer"));
    await waitFor(() =>
      expect(h.agregar).toHaveBeenCalledWith(expect.anything(), {
        sku: "SKU-1",
        cantidad: 1,
        conversacionId: h.CONV_STORE,
      })
    );
  });

  it("con prop, la prop tiene prioridad sobre la conversación del store", async () => {
    renderCart({ conversacionId: h.CONV_PROP });
    fireEvent.click(
      screen.getByRole("button", { name: /Aumentar cantidad de Zapatilla/i })
    );
    await waitFor(() =>
      expect(h.actualizar).toHaveBeenCalledWith(expect.anything(), {
        itemId: "l1",
        cantidad: 2,
        conversacionId: h.CONV_PROP,
      })
    );
  });
});
