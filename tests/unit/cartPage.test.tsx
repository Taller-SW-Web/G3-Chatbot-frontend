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
    descuentos: [] as { nombre: string; monto: number }[],
    costoEnvio: null,
    total: 100,
    avisos: [],
    promociones_ok: true,
  };
  return {
    cartData: undefined as unknown,
    CONV_STORE,
    CONV_PROP,
    CARRITO,
    actualizar: vi.fn(),
    quitar: vi.fn(),
    vaciar: vi.fn(),
    agregar: vi.fn(),
    aplicarCupon: vi.fn(),
    quitarCupon: vi.fn(),
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
vi.mock("@/application/use_cases/aplicarCuponUseCase", () => ({
  aplicarCuponUseCase: h.aplicarCupon,
}));
vi.mock("@/application/use_cases/quitarCuponUseCase", () => ({
  quitarCuponUseCase: h.quitarCupon,
}));
vi.mock("@/infrastructure/di/container", () => ({ container: { api: {} } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
// El GET resuelve la conversación del store; la página NO recibe la prop.
vi.mock("@/application/hooks/useCarrito", () => ({
  useCarrito: () => ({
    query: { data: h.cartData ?? h.CARRITO, isPending: false, isError: false, refetch: vi.fn() },
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
    h.cartData = undefined;
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

  it("muestra la imagen real y vuelve al placeholder si falla", () => {
    h.cartData = { ...h.CARRITO, lineas: [{ ...h.CARRITO.lineas[0], imagen: "https://cdn.example.com/zapatilla.jpg" }] };
    renderCart();
    const imagen = screen.getByRole("img", { name: "Zapatilla" }) as HTMLImageElement;
    expect(imagen.src).toBe("https://cdn.example.com/zapatilla.jpg");
    expect(imagen.className).toContain("object-cover");
    fireEvent.error(imagen);
    expect(screen.getByRole("img", { name: "Zapatilla" }).tagName).toBe("DIV");
  });

  it("muestra el placeholder sin imagen", () => {
    h.cartData = { ...h.CARRITO, lineas: [{ ...h.CARRITO.lineas[0], imagen: null }] };
    renderCart();
    expect(screen.getByRole("img", { name: "Zapatilla" }).tagName).toBe("DIV");
  });
});


describe("CartPage untrusted discount presentation", () => {
  afterEach(() => { cleanup(); h.cartData = undefined; });
  it.each([{}, [null], [{ nombre: 42, monto: 24.9 }], [{ nombre: {}, monto: 24.9 }], [{ nombre: "Campaign", monto: null }]])("safely renders malformed discounts %j", (discounts) => {
    h.cartData = { ...h.CARRITO, descuentos: discounts };
    expect(() => renderCart()).not.toThrow();
    expect(screen.queryByText("S/ 0.00")).toBeNull();
    if (Array.isArray(discounts) && discounts[0]?.monto === 24.9) {
      expect(screen.getByText("Descuento")).toBeTruthy();
      expect(screen.getByText("S/ 24.90")).toBeTruthy();
    } else {
      expect(screen.getByText("No pudimos mostrar todos los descuentos.")).toBeTruthy();
    }
  });
  it("keeps a valid empty discount list distinct from malformed data", () => {
    h.cartData = { ...h.CARRITO, descuentos: [] };
    renderCart();
    expect(screen.queryByText("No pudimos mostrar todos los descuentos.")).toBeNull();
  });
});

describe("CartPage: cupón (SPEC-13)", () => {
  const CLIENTE = {
    id: "cli-1",
    nombreCompleto: "Ana Díaz",
    correo: "ana@test.pe",
    celularVerificado: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    h.cartData = undefined;
    h.CARRITO.descuentos = [];
    h.CARRITO.total = 100;
    useChatStore.setState({ cliente: CLIENTE, ultimaConversacionId: null });
  });

  afterEach(() => cleanup());

  function aplicar(codigo: string) {
    fireEvent.change(screen.getByLabelText("Código de cupón"), {
      target: { value: codigo },
    });
    fireEvent.click(screen.getByRole("button", { name: /APLICAR/ }));
  }

  it("omite la conversación guardada en las mutaciones de un cliente", async () => {
    h.actualizar.mockResolvedValue(h.CARRITO);
    h.quitar.mockResolvedValue({ mensaje: "ok" });
    h.vaciar.mockResolvedValue({ mensaje: "ok" });
    h.agregar.mockResolvedValue({ ok: true });
    renderCart({ conversacionId: h.CONV_PROP });
    fireEvent.click(screen.getByRole("button", { name: /Aumentar cantidad de Zapatilla/i }));
    await waitFor(() => expect(h.actualizar).toHaveBeenCalledWith(expect.anything(), {
      itemId: "l1", cantidad: 2, conversacionId: undefined,
    }));
    fireEvent.click(screen.getByRole("button", { name: /Quitar Zapatilla/i }));
    await waitFor(() => expect(h.quitar).toHaveBeenCalledWith(expect.anything(), {
      itemId: "l1", conversacionId: undefined,
    }));
    fireEvent.click(await screen.findByTestId("btn-deshacer"));
    await waitFor(() => expect(h.agregar).toHaveBeenCalledWith(expect.anything(), {
      sku: "SKU-1", cantidad: 1, conversacionId: undefined,
    }));
  });

  it("aplica el cupón y muestra el ahorro del servidor", async () => {
    h.aplicarCupon.mockResolvedValue({
      mensaje: "Cupón SPORT10 aplicado.",
      cupon: { codigo: "SPORT10", descuento: 10, moneda: "PEN" },
      carrito: {
        ...h.CARRITO,
        descuentos: [{ nombre: "Cupón SPORT10", monto: 10 }],
        total: 90,
      },
    });

    renderCart();
    aplicar("sport10");

    await waitFor(() =>
      expect(h.aplicarCupon).toHaveBeenCalledWith(expect.anything(), "sport10", false)
    );
  });

  it("muestra el motivo cuando Productos rechaza el cupón", async () => {
    h.aplicarCupon.mockRejectedValue({
      response: { status: 422, data: { code: "CUPON_INVALIDO", motivo: "EXPIRADO" } },
    });

    renderCart();
    aplicar("VIEJO10");

    expect(await screen.findByText("El cupón venció.")).toBeDefined();
  });

  it("pide confirmación antes de reemplazar otro cupón", async () => {
    h.aplicarCupon
      .mockRejectedValueOnce({
        response: {
          status: 409,
          data: { code: "REQUIERE_CONFIRMACION_REEMPLAZO", cuponActual: "SPORT10" },
        },
      })
      .mockResolvedValueOnce({
        mensaje: "Cupón RUN10 aplicado.",
        cupon: { codigo: "RUN10", descuento: 12, moneda: "PEN" },
        carrito: {
          ...h.CARRITO,
          descuentos: [{ nombre: "Cupón RUN10", monto: 12 }],
          total: 88,
        },
      });

    renderCart();
    aplicar("RUN10");

    expect(
      await screen.findByText(/Ya tienes el cupón SPORT10/i)
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /REEMPLAZAR/ }));

    await waitFor(() =>
      expect(h.aplicarCupon).toHaveBeenLastCalledWith(
        expect.anything(),
        "RUN10",
        true
      )
    );
  });

  it.each([{}, [null], [{ nombre: 42, monto: 10 }], [{ nombre: "Cupón SPORT10", monto: null }]])(
    "safely handles malformed discounts for signed-in users: %j", (descuentos) => {
      h.cartData = { ...h.CARRITO, descuentos };
      expect(() => renderCart()).not.toThrow();
      expect(screen.queryByRole("button", { name: /Quitar cupón/i })).toBeNull();
      h.cartData = undefined;
    }
  );

  it("shows a coupon with a numeric string amount", () => {
    h.cartData = { ...h.CARRITO, descuentos: [{ nombre: "Cupón SPORT10", monto: "10" }] };
    renderCart();
    expect(screen.getByText(/ahorras S\/ 10.00/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Quitar cupón/i })).toBeTruthy();
    h.cartData = undefined;
  });

  it("quita el cupón cuando el carrito trae el descuento", async () => {
    h.CARRITO.descuentos = [{ nombre: "Cupón SPORT10", monto: 10 }];
    h.CARRITO.total = 90;
    h.quitarCupon.mockResolvedValue({
      mensaje: "Quitamos el cupón.",
      cupon: null,
      carrito: { ...h.CARRITO, descuentos: [], total: 100 },
    });

    renderCart();

    fireEvent.click(await screen.findByRole("button", { name: /Quitar cupón/i }));

    await waitFor(() => expect(h.quitarCupon).toHaveBeenCalled());
  });

  it("no muestra el cupón a un visitante anónimo", () => {
    useChatStore.setState({ cliente: null });

    renderCart();

    expect(screen.queryByTestId("cupon-carrito")).toBeNull();
  });
});
