// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ListaDevoluciones } from "@/modules/mod-postventa/ui/blocks/ListaDevoluciones";
import { ListaReclamos } from "@/modules/mod-postventa/ui/blocks/ListaReclamos";
import {
  HistorialDevoluciones,
  HistorialReclamos,
  humanizarEstado,
} from "@/modules/mod-postventa/ui/HistorialPostventa";

const push = vi.hoisted(() => vi.fn());
const listarDevoluciones = vi.hoisted(() => vi.fn());
const listarReclamos = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/shared/di/container", () => ({
  container: {
    postventa: { listarDevoluciones, listarReclamos },
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("HistorialPostventa y bloques", () => {
  it("humaniza badges de estado", () => {
    expect(humanizarEstado("SOLICITADA")).toBe("Recibida");
    expect(humanizarEstado("EN_EVALUACION")).toBe("En revisión");
    expect(humanizarEstado("APROBADA")).toBe("Aprobada");
    expect(humanizarEstado("RECHAZADA")).toBe("Rechazada");
    expect(humanizarEstado("REGISTRADO")).toBe("Recibido");
    expect(humanizarEstado("EN_PROCESO")).toBe("En revisión");
    expect(humanizarEstado("ATENDIDO")).toBe("Respondido");
    expect(humanizarEstado("DERIVADO")).toBe("Derivado a otro equipo");
    expect(humanizarEstado("RESUELTO")).toBe("Resuelto");
    expect(humanizarEstado("")).toBe("—");
    expect(humanizarEstado("OTRO_ESTADO")).toBe("Otro_estado");
  });

  it("HistorialDevoluciones muestra lista con estados humanizados", async () => {
    listarDevoluciones.mockResolvedValueOnce({
      items: [
        {
          devolucionId: "DEV-10",
          pedidoId: "PED-10",
          tipo: "CAMBIO",
          estado: "SOLICITADA",
          motivo: "TALLA_INCORRECTA",
          fechaRegistro: "2026-11-20T10:00:00Z",
          estadoReembolso: null,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    renderWithClient(<HistorialDevoluciones />);

    expect(await screen.findByText(/DEV-10/)).toBeDefined();
    expect(screen.getByText("Recibida")).toBeDefined();
  });

  it("HistorialDevoluciones muestra estado vacío y navega", async () => {
    listarDevoluciones.mockResolvedValueOnce({ items: [], total: 0, page: 1, pageSize: 20 });

    renderWithClient(<HistorialDevoluciones />);

    expect(await screen.findByRole("heading", { name: /SIN SOLICITUDES/i })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /CONSULTAR CON EL ASISTENTE/i }));
    expect(push).toHaveBeenCalledWith("/");
  });

  it("HistorialDevoluciones muestra error cuando falla la consulta", async () => {
    listarDevoluciones.mockRejectedValueOnce(new Error("Network"));

    renderWithClient(<HistorialDevoluciones />);

    expect(await screen.findByText(/No puedo consultar tus devoluciones/i)).toBeDefined();
  });

  it("HistorialReclamos muestra lista con estados humanizados", async () => {
    listarReclamos.mockResolvedValueOnce({
      items: [
        {
          reclamoId: "REC-20",
          codigoSeguimiento: "REC-20",
          tipo: "RECLAMO",
          estado: "EN_PROCESO",
          motivo: "ATENCION_INADECUADA",
          fechaRegistro: "2026-11-20T10:00:00Z",
          fechaLimiteSLA: "2026-12-10",
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    renderWithClient(<HistorialReclamos />);

    expect(await screen.findByText(/REC-20/)).toBeDefined();
    expect(screen.getByText("En revisión")).toBeDefined();
  });

  it("HistorialReclamos muestra estado vacío y navega", async () => {
    listarReclamos.mockResolvedValueOnce({ items: [], total: 0, page: 1, pageSize: 20 });

    renderWithClient(<HistorialReclamos />);

    expect(await screen.findByRole("heading", { name: "NO TIENES RECLAMOS REGISTRADOS" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /CONSULTAR CON EL ASISTENTE/i }));
    expect(push).toHaveBeenCalledWith("/");
  });

  it("HistorialReclamos muestra error cuando falla la consulta", async () => {
    listarReclamos.mockRejectedValueOnce(new Error("Network"));

    renderWithClient(<HistorialReclamos />);

    expect(await screen.findByText(/No puedo consultar tus reclamos/i)).toBeDefined();
  });

  it("ListaDevoluciones no renderiza botón cuando no hay onSeleccionar", () => {
    const devoluciones = [
      {
        devolucionId: "DEV-1",
        pedidoId: "PED-1",
        tipo: "CAMBIO",
        estado: "SOLICITADA",
        estadoEtiqueta: "Solicitada",
        motivo: "TALLA_INCORRECTA",
        fecha: "2026-11-20",
      },
    ];

    render(<ListaDevoluciones devoluciones={devoluciones} />);

    expect(screen.getByText(/DEV-1/)).toBeDefined();
    expect(screen.queryByRole("button", { name: "VER SOLICITUD" })).toBeNull();
  });

  it("ListaDevoluciones renderiza botón cuando onSeleccionar está presente y lo activa", () => {
    const devoluciones = [
      {
        devolucionId: "DEV-1",
        pedidoId: "PED-1",
        tipo: "CAMBIO",
        estado: "SOLICITADA",
        estadoEtiqueta: "Solicitada",
        motivo: "TALLA_INCORRECTA",
        fecha: "2026-11-20",
      },
    ];
    const onSeleccionar = vi.fn();

    render(<ListaDevoluciones devoluciones={devoluciones} onSeleccionar={onSeleccionar} />);

    const btn = screen.getByRole("button", { name: "VER SOLICITUD" });
    expect(btn).toBeDefined();
    fireEvent.click(btn);
    expect(onSeleccionar).toHaveBeenCalledWith("DEV-1");
  });

  it("ListaReclamos no renderiza botón cuando no hay onSeleccionar", () => {
    const reclamos = [
      {
        reclamoId: "REC-1",
        codigoSeguimiento: "REC-1",
        tipo: "RECLAMO",
        motivo: "ATENCION_INADECUADA",
        estado: "REGISTRADO",
        estadoEtiqueta: "Registrado",
        fecha: "2026-11-20",
      },
    ];

    render(<ListaReclamos reclamos={reclamos} />);

    expect(screen.getByText(/REC-1/)).toBeDefined();
    expect(screen.queryByRole("button", { name: "VER RECLAMO" })).toBeNull();
  });

  it("ListaReclamos renderiza botón cuando onSeleccionar está presente y lo activa", () => {
    const reclamos = [
      {
        reclamoId: "REC-1",
        codigoSeguimiento: "REC-1",
        tipo: "RECLAMO",
        motivo: "ATENCION_INADECUADA",
        estado: "REGISTRADO",
        estadoEtiqueta: "Registrado",
        fecha: "2026-11-20",
      },
    ];
    const onSeleccionar = vi.fn();

    render(<ListaReclamos reclamos={reclamos} onSeleccionar={onSeleccionar} />);

    const btn = screen.getByRole("button", { name: "VER RECLAMO" });
    expect(btn).toBeDefined();
    fireEvent.click(btn);
    expect(onSeleccionar).toHaveBeenCalledWith("REC-1");
  });
});
