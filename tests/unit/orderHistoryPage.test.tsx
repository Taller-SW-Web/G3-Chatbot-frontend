// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrderHistoryPage } from "@/adapters/inbound/pages/OrderHistoryPage";

const push = vi.hoisted(() => vi.fn());
const listarPedidos = vi.hoisted(() => vi.fn());
const listarDevoluciones = vi.hoisted(() => vi.fn());
const listarReclamos = vi.hoisted(() => vi.fn());
const calificarPedido = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/infrastructure/di/container", () => ({
  container: {
    api: { listarPedidos, listarDevoluciones, listarReclamos, calificarPedido },
  },
}));

function renderPage(ui = <OrderHistoryPage />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  listarPedidos.mockResolvedValue({
    items: [
      {
        pedidoId: "PED-2026-00001",
        canal: "CHATBOT",
        estado: "EN_PREPARACION",
        estadoEtiqueta: "En preparación",
        total: 129.9,
        moneda: "PEN",
        fechaCreacion: "2026-11-10T10:00:00Z",
      },
      {
        pedidoId: "PED-2026-00002",
        canal: "CHATBOT",
        estado: "ENTREGADO",
        estadoEtiqueta: "Entregado",
        total: 299.9,
        moneda: "PEN",
        fechaCreacion: "2026-11-02T10:00:00Z",
      },
    ],
    total: 2,
    page: 1,
    pageSize: 20,
  });
  listarDevoluciones.mockResolvedValue({
    items: [
      {
        devolucionId: "DEV-2026-00045",
        pedidoId: "PED-2026-00002",
        tipo: "CAMBIO",
        estado: "SOLICITADA",
        motivo: "OTRO",
        fechaRegistro: "2026-11-10T10:00:00Z",
      },
    ],
    total: 1,
    page: 1,
    pageSize: 20,
  });
  listarReclamos.mockResolvedValue({
    items: [
      {
        reclamoId: "REC-2026-0118",
        codigoSeguimiento: "REC-2026-0118",
        pedidoId: "PED-2026-00002",
        tipo: "RECLAMO",
        motivo: "PRODUCTO_DEFECTUOSO_O_INCORRECTO",
        estado: "EN_PROCESO",
        fechaRegistro: "2026-11-10T10:00:00Z",
        fechaLimiteSLA: "2026-12-01T23:59:59Z",
      },
    ],
    total: 1,
    page: 1,
    pageSize: 20,
  });
});

afterEach(cleanup);

describe("OrderHistoryPage", () => {
  it("abre en 'En proceso' con los pedidos reales", async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText("Pedido PED-2026-00001")).toBeDefined());
    expect(screen.getByText("En preparación")).toBeDefined();

    fireEvent.click(screen.getByText("VER SEGUIMIENTO"));
    expect(push).toHaveBeenCalledWith("/seguimiento?pedidoId=PED-2026-00001");
  });

  it("en 'Entregados' permite calificar y abrir reclamo o devolución", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Entregados"));

    await waitFor(() => expect(screen.getByText("Pedido PED-2026-00002")).toBeDefined());
    fireEvent.click(screen.getByRole("radio", { name: "Bien" }));
    await waitFor(() => expect(calificarPedido).toHaveBeenCalledWith("PED-2026-00002", 5));

    fireEvent.click(screen.getByText("REPORTAR PROBLEMA"));
    expect(push).toHaveBeenCalledWith("/reclamo?pedidoId=PED-2026-00002");
    fireEvent.click(screen.getByText(/SOLICITAR CAMBIO O DEVOLUCI/));
    expect(push).toHaveBeenCalledWith("/devolucion?pedidoId=PED-2026-00002");
  });

  it("lista devoluciones y reclamos reales", async () => {
    renderPage();

    fireEvent.click(screen.getByText(/Reembolso\/ ?Cambio/));
    await waitFor(() => expect(screen.getByText("DEV-2026-00045")).toBeDefined());

    fireEvent.click(screen.getByText("Reclamos"));
    await waitFor(() => expect(screen.getByText(/REC-2026-0118/)).toBeDefined());
  });

  it("respeta la pestaña inicial", async () => {
    renderPage(<OrderHistoryPage initialTab="reclamos" />);
    await waitFor(() => expect(screen.getByText(/REC-2026-0118/)).toBeDefined());
    expect(screen.queryByText("Pedido PED-2026-00001")).toBeNull();
  });
});
