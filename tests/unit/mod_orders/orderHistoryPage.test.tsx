// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrderHistoryPage } from "@/modules/mod-orders/ui/OrderHistoryPage";
import { HistorialDevoluciones, HistorialReclamos } from "@/modules/mod-postventa/ui/HistorialPostventa";

const push = vi.hoisted(() => vi.fn());
const listarPedidos = vi.hoisted(() => vi.fn());
const listarDevoluciones = vi.hoisted(() => vi.fn());
const listarReclamos = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/shared/di/container", () => ({
  container: {
    pedidos: { listarPedidos },
    postventa: { listarDevoluciones, listarReclamos },
  },
}));

/** Mismo contrato que arma `app/pedidos/page.tsx`. */
function slots() {
  return { reembolso: <HistorialDevoluciones />, reclamos: <HistorialReclamos /> };
}

function renderPage(ui = <OrderHistoryPage slots={slots()} />) {
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
      {
        pedidoId: "PED-2026-00003",
        canal: "CHATBOT",
        estado: "ANULADO",
        estadoEtiqueta: "Anulado",
        total: 89.9,
        moneda: "PEN",
        fechaCreacion: "2026-10-28T10:00:00Z",
      },
    ],
    total: 3,
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

  it("abre el detalle del pedido desde la tarjeta", async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText("Pedido PED-2026-00001")).toBeDefined());
    fireEvent.click(screen.getAllByText("VER DETALLE")[0]);
    expect(push).toHaveBeenCalledWith("/pedido?pedidoId=PED-2026-00001");
  });

  it("en 'Entregados' no muestra el CSAT en la lista y permite abrir reclamo o devolución", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Entregados"));

    await waitFor(() => expect(screen.getByText("Pedido PED-2026-00002")).toBeDefined());
    expect(screen.getByText("Pedido PED-2026-00003")).toBeDefined();
    expect(screen.queryByText("Califica tu entrega")).toBeNull();
    expect(screen.queryByLabelText("Calificar entrega del pedido PED-2026-00002")).toBeNull();
    expect(screen.queryByRole("radio", { name: "Bien" })).toBeNull();

    fireEvent.click(screen.getByText("REPORTAR PROBLEMA"));
    expect(push).toHaveBeenCalledWith("/reclamo?pedidoId=PED-2026-00002");
    fireEvent.click(screen.getByText(/SOLICITAR CAMBIO O DEVOLUCI/));
    expect(push).toHaveBeenCalledWith("/devolucion?pedidoId=PED-2026-00002");
  });

  it("lista devoluciones y reclamos reales", async () => {
    renderPage();

    fireEvent.click(screen.getByText(/Reembolso\/ ?Cambio/));
    await waitFor(() => expect(screen.getByText(/DEV-2026-00045/)).toBeDefined());

    fireEvent.click(screen.getByText("Reclamos"));
    await waitFor(() => expect(screen.getByText(/REC-2026-0118/)).toBeDefined());
  });

  it("respeta la pestaña inicial", async () => {
    renderPage(<OrderHistoryPage initialTab="reclamos" slots={slots()} />);
    await waitFor(() => expect(screen.getByText(/REC-2026-0118/)).toBeDefined());
    expect(screen.queryByText("Pedido PED-2026-00001")).toBeNull();
  });

  it("no consulta postventa cuando el slot no está inyectado", async () => {
    renderPage(<OrderHistoryPage initialTab="reembolso" />);
    expect(screen.queryByText(/DEV-2026-00045/)).toBeNull();
    expect(listarDevoluciones).not.toHaveBeenCalled();
    expect(listarReclamos).not.toHaveBeenCalled();
  });

  it("muestra el estado vacío centrado con botón al chat cuando no hay pedidos", async () => {
    listarPedidos.mockResolvedValueOnce({ items: [], total: 0, page: 1, pageSize: 20 });
    renderPage();

    await waitFor(() => expect(screen.getByText("NO TIENES PEDIDOS EN PROCESO")).toBeDefined());
    expect(screen.getByText(/Aún no tienes pedidos en esta pestaña/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "CONSULTAR CON EL ASISTENTE" }));
    expect(push).toHaveBeenCalledWith("/");
  });

  it("en 'Entregados' muestra motivo de anulación y reembolso para pedidos ANULADO", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Entregados"));

    await waitFor(() => expect(screen.getByText("Pedido PED-2026-00003")).toBeDefined());
    expect(screen.getAllByText("Anulado por falta de stock").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText("Si corresponde un reembolso, se procesará al medio de pago original.")
    ).toBeDefined();
  });

  it("muestra estado de error y permite reintentar la consulta de pedidos", async () => {
    listarPedidos.mockRejectedValueOnce(new Error("network failure"));
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("No puedo consultar tus pedidos en este momento.")).toBeDefined()
    );
    const retryBtn = screen.getByRole("button", { name: "REINTENTAR" });
    expect(retryBtn).toBeDefined();

    fireEvent.click(retryBtn);
    await waitFor(() => expect(listarPedidos).toHaveBeenCalledTimes(2));
  });
});
