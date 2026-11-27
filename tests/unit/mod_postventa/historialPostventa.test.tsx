// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ListaDevoluciones } from "@/modules/mod-postventa/ui/blocks/ListaDevoluciones";
import { ListaReclamos } from "@/modules/mod-postventa/ui/blocks/ListaReclamos";
import { humanizarEstado } from "@/modules/mod-postventa/ui/HistorialPostventa";

afterEach(cleanup);

describe("HistorialPostventa y bloques", () => {
  it("humaniza badges de estado", () => {
    expect(humanizarEstado("SOLICITADA")).toBe("Solicitada");
    expect(humanizarEstado("APROBADA")).toBe("Aprobada");
    expect(humanizarEstado("RECHAZADA")).toBe("Rechazada");
    expect(humanizarEstado("REGISTRADO")).toBe("Registrado");
    expect(humanizarEstado("EN_PROCESO")).toBe("En proceso");
    expect(humanizarEstado("RESUELTO")).toBe("Resuelto");
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

  it("ListaDevoluciones renderiza botón cuando onSeleccionar está presente", () => {
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

    expect(screen.getByRole("button", { name: "VER SOLICITUD" })).toBeDefined();
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
});
