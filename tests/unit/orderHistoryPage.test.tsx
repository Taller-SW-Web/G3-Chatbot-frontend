// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { OrderHistoryPage } from "@/adapters/inbound/pages/OrderHistoryPage";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("OrderHistoryPage", () => {
  it("abre en 'En proceso' con el seguimiento del pedido", () => {
    render(<OrderHistoryPage />);

    expect(screen.getByText("Pedido #A-1042")).toBeDefined();
    expect(screen.getByText("EN CAMINO")).toBeDefined();
    expect(screen.getByText("Pago confirmado")).toBeDefined();

    fireEvent.click(screen.getByText("VER SEGUIMIENTO"));
    expect(push).toHaveBeenCalledWith("/seguimiento");
  });

  it("en 'Entregados' permite calificar la entrega y abrir reclamo o devolución", () => {
    render(<OrderHistoryPage />);
    fireEvent.click(screen.getByText("Entregados"));

    expect(screen.getByText("Pedido PED-2026-00891")).toBeDefined();
    expect(screen.getByText("2 sep 2026")).toBeDefined();

    fireEvent.click(screen.getByRole("radio", { name: "Bien" }));
    expect(screen.getByText(/Gracias por su opinión/)).toBeDefined();
    fireEvent.click(screen.getByText("Cambiar"));
    expect(screen.getByRole("radio", { name: "Bien" })).toBeDefined();

    fireEvent.click(screen.getByText("REPORTAR UN PROBLEMA"));
    expect(push).toHaveBeenCalledWith("/reclamo");
    fireEvent.click(screen.getByText(/SOLICITAR CAMBIO O DEVOLUCI/));
    expect(push).toHaveBeenCalledWith("/devolucion");
  });

  it("lista devoluciones y reclamos con sus códigos", () => {
    render(<OrderHistoryPage />);

    fireEvent.click(screen.getByText(/Reembolso\/ Cambio/));
    expect(screen.getByText("#R-0312")).toBeDefined();
    expect(screen.getByText("DEV-2026-00045")).toBeDefined();

    fireEvent.click(screen.getByText("Reclamos"));
    expect(screen.getByText(/REC-2026-0118/)).toBeDefined();
  });

  it("respeta la pestaña inicial", () => {
    render(<OrderHistoryPage initialTab="reclamos" />);
    expect(screen.getByText(/REC-2026-0118/)).toBeDefined();
    expect(screen.queryByText("Pedido #A-1042")).toBeNull();
  });
});
