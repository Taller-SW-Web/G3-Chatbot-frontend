// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { CheckoutPage } from "@/adapters/inbound/pages/CheckoutPage";
import { useChatStore } from "@/application/state/chatStore";

const navMock = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: navMock.push,
    replace: navMock.replace,
  }),
}));

const mockApi = {
  iniciarCheckout: vi.fn(),
  pagarCheckout: vi.fn(),
};

vi.mock("@/infrastructure/di/container", () => ({
  container: {
    api: {
      iniciarCheckout: (...args: unknown[]) => mockApi.iniciarCheckout(...args),
      pagarCheckout: (...args: unknown[]) => mockApi.pagarCheckout(...args),
    },
  },
}));

function resetStore() {
  useChatStore.setState({
    cliente: {
      id: "cli-1",
      nombreCompleto: "Diego Comprador",
      correo: "diego@test.pe",
      celularVerificado: true,
    },
    carrito: {
      lineas: [
        {
          item_id: "linea-1",
          sku: "SKU-ZAP-1",
          cantidad: 1,
          producto: {
            sku: "SKU-ZAP-1",
            nombre: "Zapatilla Runner",
            precio: 120.0,
            categoria: "Calzado",
            talla: "42",
            color: "Negro",
          },
        },
      ],
      subtotal: 120.0,
      count: 1,
    },
    ultimoPedido: null,
  });

  navMock.push.mockClear();
  navMock.replace.mockClear();
  mockApi.iniciarCheckout.mockReset();
  mockApi.pagarCheckout.mockReset();
}

function llenarDireccionValida() {
  fireEvent.change(screen.getByPlaceholderText("Nombre completo"), {
    target: { value: "Diego Comprador" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dirección exacta"), {
    target: { value: "Av. Las Palmeras 123" },
  });
  fireEvent.change(screen.getByLabelText("Distrito de entrega"), {
    target: { value: "Miraflores" },
  });
  fireEvent.change(screen.getByPlaceholderText("8 dígitos"), {
    target: { value: "12345678" },
  });
}

describe("CheckoutPage (SPEC-14, H4-F3)", () => {
  beforeEach(resetStore);
  afterEach(cleanup);

  it("renderiza paso 1 de dirección y calcula el total", () => {
    render(createElement(CheckoutPage));

    expect(screen.getByText("Paso 1 de 2")).toBeDefined();
    expect(screen.getByText("Total a pagar:")).toBeDefined();
    expect(screen.getByText("CONFIRMAR Y PAGAR S/ 120.00")).toBeDefined();
  });

  it("inicia checkout en backend al confirmar dirección y avanza al paso 2", async () => {
    mockApi.iniciarCheckout.mockResolvedValueOnce({
      id: "chk-uuid-1",
      cartId: "cart-uuid-1",
      status: "PENDING_PAYMENT",
      total: 132.5,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      intentosRestantes: 3,
      summary: {},
    });

    render(createElement(CheckoutPage));

    llenarDireccionValida();

    const submitBtn = screen.getByRole("button", { name: /CONFIRMAR Y PAGAR/i });
    await waitFor(() => {
      expect(submitBtn.hasAttribute("disabled")).toBe(false);
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockApi.iniciarCheckout).toHaveBeenCalled();
      expect(screen.getByText("Paso 2 de 2")).toBeDefined();
      expect(screen.getByText(/Pago simulado – entorno académico/i)).toBeDefined();
      expect(screen.getByText(/Intentos 3\/3/i)).toBeDefined();
    });
  });

  it("completa pago aprobado con tarjeta de prueba y redirige a /exito", async () => {
    mockApi.iniciarCheckout.mockResolvedValueOnce({
      id: "chk-uuid-1",
      cartId: "cart-uuid-1",
      status: "PENDING_PAYMENT",
      total: 132.5,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      intentosRestantes: 3,
      summary: {},
    });

    mockApi.pagarCheckout.mockResolvedValueOnce({
      id: "att-uuid-1",
      checkoutId: "chk-uuid-1",
      resultado: "APROBADO",
      marca: "VISA",
      ultimos4: "1111",
      monto: 132.5,
      idTransaccion: "SIM-12345",
    });

    render(createElement(CheckoutPage));

    // Avanzar a paso 2
    llenarDireccionValida();

    const confirmarBtn = screen.getByRole("button", { name: /CONFIRMAR Y PAGAR/i });
    await waitFor(() => expect(confirmarBtn.hasAttribute("disabled")).toBe(false));
    fireEvent.click(confirmarBtn);

    await waitFor(() => expect(screen.getByText("Paso 2 de 2")).toBeDefined());

    // Llenar tarjeta
    fireEvent.change(screen.getByPlaceholderText("Nombre del titular de la tarjeta"), {
      target: { value: "Diego Comprador" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Número de tarjeta/i), {
      target: { value: "4111 1111 1111 1111" },
    });
    fireEvent.change(screen.getByPlaceholderText("MM/AA"), {
      target: { value: "12/28" },
    });
    fireEvent.change(screen.getByPlaceholderText(/CVV/i), {
      target: { value: "123" },
    });

    const pagarBtn = screen.getByRole("button", { name: /PAGAR S\//i });
    await waitFor(() => expect(pagarBtn.hasAttribute("disabled")).toBe(false));

    fireEvent.click(pagarBtn);

    await waitFor(() => {
      expect(mockApi.pagarCheckout).toHaveBeenCalledWith("chk-uuid-1", expect.objectContaining({
        numeroTarjeta: "4111111111111111",
        titular: "Diego Comprador",
        vencimiento: "12/28",
        cvv: "123",
      }));
      expect(navMock.push).toHaveBeenCalledWith("/exito");
      expect(useChatStore.getState().ultimoPedido).not.toBeNull();
    });
  });

  it("muestra error y descuenta intentos al recibir 402 PAGO_RECHAZADO", async () => {
    mockApi.iniciarCheckout.mockResolvedValueOnce({
      id: "chk-uuid-2",
      cartId: "cart-uuid-2",
      status: "PENDING_PAYMENT",
      total: 132.5,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      intentosRestantes: 3,
      summary: {},
    });

    const rejectedError = {
      response: {
        status: 402,
        data: {
          code: "PAGO_RECHAZADO",
          motivo: "FONDOS_INSUFICIENTES",
          intentosRestantes: 2,
          detail: "Tu tarjeta fue rechazada por fondos insuficientes.",
        },
      },
    };
    mockApi.pagarCheckout.mockRejectedValueOnce(rejectedError);

    render(createElement(CheckoutPage));

    // Paso 1 -> 2
    llenarDireccionValida();

    const confirmarBtn = screen.getByRole("button", { name: /CONFIRMAR Y PAGAR/i });
    await waitFor(() => expect(confirmarBtn.hasAttribute("disabled")).toBe(false));
    fireEvent.click(confirmarBtn);

    await waitFor(() => expect(screen.getByText("Paso 2 de 2")).toBeDefined());

    // Tarjeta con fondos insuficientes
    fireEvent.change(screen.getByPlaceholderText("Nombre del titular de la tarjeta"), {
      target: { value: "Diego Comprador" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Número de tarjeta/i), {
      target: { value: "4000 0000 0000 0002" },
    });
    fireEvent.change(screen.getByPlaceholderText("MM/AA"), {
      target: { value: "12/28" },
    });
    fireEvent.change(screen.getByPlaceholderText(/CVV/i), {
      target: { value: "123" },
    });

    const pagarBtn = screen.getByRole("button", { name: /PAGAR S\//i });
    await waitFor(() => expect(pagarBtn.hasAttribute("disabled")).toBe(false));

    fireEvent.click(pagarBtn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
      expect(screen.getByText(/fondos insuficientes/i)).toBeDefined();
      expect(screen.getByText(/Intentos 2\/3/i)).toBeDefined();
    });
  });
});
