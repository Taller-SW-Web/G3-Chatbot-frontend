// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { OrderSuccessPage } from "@/modules/mod-checkout/ui/OrderSuccessPage";
import { useChatStore } from "@/shared/auth/chatStore";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("OrderSuccessPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    useChatStore.setState({ ultimoPedido: null });
  });

  it("muestra '¡PEDIDO CONFIRMADO!' cuando el pedido fue completado normalmente", () => {
    useChatStore.setState({
      ultimoPedido: {
        orderId: "PED-2026-00891",
        total: 150,
        subtotal: 140,
        costoEnvio: 10,
        lineas: [{ nombre: "Zapatilla Run", cantidad: 1, precio: 140 }],
        direccion: "Av. Larco 123",
        distrito: "Miraflores",
        nombre: "Juan Pérez",
        tarjetaMarca: "Visa",
        tarjetaLast4: "1234",
        correoEnmascarado: "j***z@correo.com",
      },
    });

    render(<OrderSuccessPage />);

    expect(screen.getByText("¡PEDIDO CONFIRMADO!")).toBeDefined();
    expect(screen.getByText("Total pagado")).toBeDefined();
    expect(screen.queryByText("PEDIDO ANULADO")).toBeNull();
  });

  it("muestra 'PEDIDO ANULADO' y aviso de reembolso si el pedido fue anulado por stock", () => {
    useChatStore.setState({
      ultimoPedido: {
        orderId: "PED-2026-00891",
        total: 150,
        subtotal: 140,
        costoEnvio: 10,
        lineas: [{ nombre: "Zapatilla Run", cantidad: 1, precio: 140 }],
        direccion: "Av. Larco 123",
        distrito: "Miraflores",
        nombre: "Juan Pérez",
        tarjetaMarca: "Visa",
        tarjetaLast4: "1234",
        correoEnmascarado: "j***z@correo.com",
        estado: "ANULADO",
        motivo: "STOCK_NO_DISPONIBLE",
      },
    });

    render(<OrderSuccessPage />);

    expect(screen.getByText("PEDIDO ANULADO")).toBeDefined();
    expect(screen.getByText("Anulado por falta de stock")).toBeDefined();
    expect(screen.getByText("Total a reembolsar")).toBeDefined();
    expect(
      screen.getByText(/Si corresponde un reembolso, se procesará al medio de pago original/i)
    ).toBeDefined();
    expect(screen.queryByText("¡PEDIDO CONFIRMADO!")).toBeNull();
    expect(screen.queryByText("Calificar mi compra")).toBeNull();
  });
});
