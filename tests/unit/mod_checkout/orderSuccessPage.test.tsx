// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { OrderSuccessPage } from "@/modules/mod-checkout/ui/OrderSuccessPage";
import { useChatStore } from "@/shared/auth/chatStore";

const navMock = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navMock.push }),
}));

describe("OrderSuccessPage: confirmación real sin datos demo (SPEC-16, SPEC-24)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChatStore.setState({
      cliente: null,
      ultimoPedido: null,
    });
  });

  afterEach(cleanup);

  it("en incógnito sin pedido no muestra ID, total ni tarjeta, ni dispara valoración", () => {
    render(<OrderSuccessPage />);

    expect(screen.getByTestId("pedido-no-encontrado")).toBeDefined();
    expect(screen.getByText("No se encontró información del pedido")).toBeDefined();
    expect(screen.queryByText(/PED-2026-00891/)).toBeNull();
    expect(screen.queryByText(/cliente\.demo@correo\.com/)).toBeNull();
    expect(screen.queryByText(/Total pagado/)).toBeNull();
    expect(screen.queryByTestId("rating-popup")).toBeNull();
    expect(screen.queryByText(/¡PEDIDO CONFIRMADO!/)).toBeNull();
  });

  it("con pedido confirmado real muestra orderId, total, tarjeta y habilita calificación", () => {
    useChatStore.setState({
      cliente: {
        id: "cli-1",
        nombreCompleto: "Rosa Flores",
        correo: "rosa@test.pe",
        celularVerificado: true,
      },
      ultimoPedido: {
        orderId: "PED-REAL-12345",
        nuevoEstado: "PAGADO",
        plazoEstimadoDias: 1,
        total: 189.5,
        subtotal: 175.0,
        costoEnvio: 14.5,
        lineas: [
          {
            nombre: "Casaca Cortaviento",
            cantidad: 1,
            precio: 175.0,
          },
        ],
        direccion: "Calle Las Begonias 450",
        distrito: "San Isidro",
        nombre: "Rosa Flores",
        tarjetaMarca: "Mastercard",
        tarjetaLast4: "5678",
        correoEnmascarado: "r***@test.pe",
      } as never,
    });

    render(<OrderSuccessPage />);

    expect(screen.getByText("¡PEDIDO CONFIRMADO!")).toBeDefined();
    expect(screen.getByText(/PED-REAL-12345/)).toBeDefined();
    expect(screen.getByText(/Entrega estimada en 1 día hábil\./)).toBeDefined();
    expect(screen.getByText("S/ 189.50")).toBeDefined();
    expect(screen.getByText("Mastercard •••• 5678")).toBeDefined();
    expect(screen.getByText("Calle Las Begonias 450 · San Isidro")).toBeDefined();
    expect(screen.getByText(/Te enviaremos la confirmación a r\*\*\*@test\.pe/)).toBeDefined();
    expect(screen.queryByText(/PED-2026-00891/)).toBeNull();
    expect(screen.queryByText(/cliente\.demo@correo\.com/)).toBeNull();
  });

  it("con pago en proceso muestra 'PAGO RECIBIDO' antes del ACK (SPEC-14 :166,173)", () => {
    useChatStore.setState({
      cliente: { id: "cli-1", nombreCompleto: "Rosa", correo: "rosa@test.pe" },
      ultimoPedido: {
        orderId: "PED-PROC-999",
        estado: "PAGO_EN_PROCESO",
        plazoEstimadoDias: 2,
        total: 100,
        subtotal: 100,
        costoEnvio: 0,
        lineas: [{ nombre: "P1", cantidad: 1, precio: 100 }],
        tarjetaMarca: "Visa",
        tarjetaLast4: "1234",
      } as never,
    });

    render(<OrderSuccessPage />);

    expect(screen.getByText("PAGO RECIBIDO")).toBeDefined();
    expect(screen.getByText(/Pago recibido\. Estamos confirmando tu pedido\.\.\./)).toBeDefined();
    expect(screen.getByText(/Entrega estimada en 2 días hábiles\./)).toBeDefined();
    expect(screen.queryByText(/¡PEDIDO CONFIRMADO!/)).toBeNull();
  });

  it("en incógnito permite volver a mis pedidos o seguir comprando", () => {
    render(<OrderSuccessPage />);
    fireEvent.click(screen.getByRole("button", { name: "VER MIS PEDIDOS" }));
    expect(navMock.push).toHaveBeenCalledWith("/pedidos");

    fireEvent.click(screen.getByRole("button", { name: "SEGUIR COMPRANDO" }));
    expect(navMock.push).toHaveBeenCalledWith("/");
  });

  it("con pedido permite ver estado, seguir comprando o calificar compra", () => {
    useChatStore.setState({
      cliente: { id: "cli-1", nombreCompleto: "Rosa", correo: "rosa@test.pe" },
      ultimoPedido: {
        orderId: "PED-1",
        total: 100,
        subtotal: 100,
        costoEnvio: 0,
        lineas: [{ nombre: "P1", cantidad: 1, precio: 100 }],
        tarjetaMarca: "Visa",
        tarjetaLast4: "1234",
      },
    });

    render(<OrderSuccessPage />);

    fireEvent.click(screen.getByRole("button", { name: "VER ESTADO DEL PEDIDO" }));
    expect(navMock.push).toHaveBeenCalledWith("/pedidos");

    fireEvent.click(screen.getByRole("button", { name: "SEGUIR COMPRANDO" }));
    expect(navMock.push).toHaveBeenCalledWith("/");

    fireEvent.click(screen.getByText("Calificar mi compra"));
    expect(screen.getByText("Califica tu compra")).toBeDefined();
  });
});
