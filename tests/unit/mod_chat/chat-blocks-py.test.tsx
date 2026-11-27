// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MessageBubble } from "@/modules/mod-chat/ui/MessageBubble";
import type { Bloque } from "@/modules/mod-chat/domain/entities/Bloque";
import { useChatStore } from "@/shared/auth/chatStore";

const h = vi.hoisted(() => ({ reenviar: vi.fn(), subirEvidencia: vi.fn() }));
vi.mock("@/shared/di/container", () => ({
  container: {
    auth: { reenviarVerificacion: h.reenviar },
    postventa: { subirEvidencia: h.subirEvidencia },
  },
}));
vi.mock("@/shared/auth/usePerfil", () => ({
  usePerfil: () => ({
    data: {
      nombreCompleto: "Juan Pérez",
      correo: "juan@example.com",
      celular: "+51999888777",
      celularVerificado: true,
      ultimoDocumento: null,
    },
    isLoading: false,
    isError: false,
  }),
}));

const PEDIDO = {
  pedidoId: "PED-2026-00891",
  fecha: "15/11/2026 10:30",
  total: "S/ 289.90",
  estado: "DESPACHADO",
  estadoEtiqueta: "En camino",
  canal: "WEB",
};

const SEGUIMIENTO = {
  estado: "EN_CAMINO",
  estadoEtiqueta: "En camino",
  fechaProgramada: "17/11/2026",
  distrito: "Lima",
  recibidoPor: null,
  detalleDisponible: true,
  mensaje: null,
  hitos: [{ titulo: "En ruta al domicilio", fecha: "16/11/2026 08:00", completado: true }],
};

const RECLAMO = {
  codigoSeguimiento: "REC-2026-0042",
  fecha: "20/11/2026 09:15",
  pedidoId: "PED-2026-00891",
  tipo: "RECLAMO",
  motivo: "Producto defectuoso",
  estado: "EN_PROCESO",
  estadoEtiqueta: "En proceso",
  fechaLimiteSLA: "11/12/2026",
};

const DEVOLUCION = {
  devolucionId: "DEV-2026-0042",
  pedidoId: "PED-2026-00891",
  fecha: "21/11/2026 12:00",
  tipo: "DEVOLUCION_DINERO",
  motivo: "Talla incorrecta",
  estado: "EN_EVALUACION",
  estadoEtiqueta: "En evaluación",
};

function bubble(bloques: Bloque[], onQuickAction?: (a: unknown) => void) {
  return render(<MessageBubble rol="bot" texto="" bloques={bloques} onQuickAction={onQuickAction} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  h.reenviar.mockResolvedValue({ ok: true });
  useChatStore.setState({ cliente: null, authOpen: false, authVista: "login", accionPendiente: null });
});

afterEach(cleanup);

describe("renderer de bloques de pedidos y postventa (delta M5)", () => {
  it("LISTA_PEDIDOS muestra los seis campos y permite elegir el pedido", () => {
    const onAction = vi.fn();
    bubble([{
      id: "lp",
      tipo: "LISTA_PEDIDOS",
      datos: {
        pedidos: [PEDIDO, { ...PEDIDO, pedidoId: "PED-2026-00902", estadoEtiqueta: "Entregado", estado: "ENTREGADO" }],
        mensaje: "Puedes ver el historial completo en Mis pedidos.",
      },
    }], onAction);

    expect(screen.getByTestId("bloque-lista-pedidos")).toBeTruthy();
    expect(screen.getByText("Pedido PED-2026-00891")).toBeTruthy();
    expect(screen.getAllByText("15/11/2026 10:30").length).toBe(2);
    expect(screen.getAllByText("S/ 289.90").length).toBe(2);
    expect(screen.getByText("En camino")).toBeTruthy();
    expect(screen.getAllByText("WEB").length).toBe(2);
    expect(screen.getByText("Entregado")).toBeTruthy();
    expect(screen.getByText("Puedes ver el historial completo en Mis pedidos.")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "VER PEDIDO" })[0]);
    expect(onAction).toHaveBeenCalledWith({ id: "CONSULTAR_PEDIDOS", etiqueta: "Ver pedido", payload: { pedidoId: "PED-2026-00891" } });
  });

  it("ESTADO_PEDIDO pinta los hitos de Ventas y el seguimiento de Despacho por separado", () => {
    bubble([{
      id: "ep",
      tipo: "ESTADO_PEDIDO",
      datos: {
        pedido: {
          ...PEDIDO,
          envio: { direccion: "Av. Arequipa 123", distrito: "Lima" },
          items: [{ descripcion: "Nike Revolution 7", cantidad: 1 }],
        },
        hitos: [
          { titulo: "Pedido creado", fecha: "15/11/2026 10:30", done: true },
          { titulo: "Pedido despachado", fecha: "16/11/2026 09:00", done: true },
        ],
        seguimiento: SEGUIMIENTO,
      },
    }]);

    expect(screen.getByTestId("bloque-estado-pedido")).toBeTruthy();
    expect(screen.getByText("Pedido PED-2026-00891")).toBeTruthy();
    expect(screen.getByText("Entrega: Av. Arequipa 123 · Lima")).toBeTruthy();
    expect(screen.getByText("1 × Nike Revolution 7")).toBeTruthy();
    expect(screen.getByText("Pedido creado")).toBeTruthy();
    expect(screen.getByText("Pedido despachado")).toBeTruthy();
    expect(screen.getByTestId("bloque-seguimiento")).toBeTruthy();
    expect(screen.getByText("Seguimiento del despacho")).toBeTruthy();
    expect(screen.getByText("17/11/2026")).toBeTruthy();
    expect(screen.getByText("En ruta al domicilio")).toBeTruthy();
    const enlace = screen.getByRole("link", { name: "VER SEGUIMIENTO" });
    expect(enlace.getAttribute("href")).toBe("/seguimiento?pedidoId=PED-2026-00891");
  });

  it("ESTADO_PEDIDO sin detalle disponible muestra el mensaje y no el enlace", () => {
    bubble([{
      id: "ep2",
      tipo: "ESTADO_PEDIDO",
      datos: {
        pedido: PEDIDO,
        hitos: [{ titulo: "Pedido creado", fecha: "15/11/2026 10:30", done: true }],
        seguimiento: { ...SEGUIMIENTO, detalleDisponible: false, mensaje: "Aún se está preparando." },
      },
    }]);

    expect(screen.getByText("Aún se está preparando.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "VER SEGUIMIENTO" })).toBeNull();
  });

  it("LISTA_RECLAMOS muestra código, fecha, pedido, motivo y estado", () => {
    const onAction = vi.fn();
    bubble([{
      id: "lr",
      tipo: "LISTA_RECLAMOS",
      datos: { reclamos: [RECLAMO, { ...RECLAMO, codigoSeguimiento: "REC-2026-0050", estadoEtiqueta: "Resuelto" }] },
    }], onAction);

    expect(screen.getByTestId("bloque-lista-reclamos")).toBeTruthy();
    expect(screen.getByText("Reclamo REC-2026-0042")).toBeTruthy();
    expect(screen.getAllByText("20/11/2026 09:15").length).toBe(2);
    expect(screen.getAllByText("PED-2026-00891").length).toBe(2);
    expect(screen.getAllByText("Producto defectuoso").length).toBe(2);
    expect(screen.getByText("En proceso")).toBeTruthy();
    expect(screen.getAllByText("11/12/2026").length).toBe(2);

    fireEvent.click(screen.getAllByRole("button", { name: "VER RECLAMO" })[0]);
    expect(onAction).toHaveBeenCalledWith({ id: "CONSULTAR_RECLAMO", etiqueta: "Ver reclamo", payload: { codigoSeguimiento: "REC-2026-0042" } });
  });

  it("ESTADO_RECLAMO respeta textualmente respuestaVisibleCliente", () => {
    const respuesta = "Revisamos tu caso con calidad. El cambio se aprueba y sale mañana; no requiere pago.";
    bubble([{
      id: "er",
      tipo: "ESTADO_RECLAMO",
      datos: { ...RECLAMO, respuestaVisibleCliente: respuesta },
    }]);

    expect(screen.getByTestId("bloque-estado-reclamo")).toBeTruthy();
    expect(screen.getByText(respuesta)).toBeTruthy();
    expect(screen.getByText("11/12/2026")).toBeTruthy();
  });

  it("CONSTANCIA_RECLAMO muestra el mensaje del backend y el código para consultar", () => {
    bubble([{
      id: "cr",
      tipo: "CONSTANCIA_RECLAMO",
      datos: { ...RECLAMO, mensaje: "Registramos tu reclamo en el Libro de Reclamaciones." },
    }]);

    expect(screen.getByTestId("bloque-constancia-reclamo")).toBeTruthy();
    expect(screen.getByText("Registramos tu reclamo en el Libro de Reclamaciones.")).toBeTruthy();
    expect(screen.getByText("Guarda este código para consultar tu reclamo.")).toBeTruthy();
    expect(screen.getByText("Reclamo REC-2026-0042")).toBeTruthy();
  });

  it("LISTA_DEVOLUCIONES muestra el estado de reembolso cuando existe", () => {
    const onAction = vi.fn();
    bubble([{
      id: "ld",
      tipo: "LISTA_DEVOLUCIONES",
      datos: {
        devoluciones: [
          { ...DEVOLUCION, estadoReembolso: "PROGRAMADO" },
          { ...DEVOLUCION, devolucionId: "DEV-2026-0050", estadoEtiqueta: "Aprobada", estado: "APROBADA" },
        ],
      },
    }], onAction);

    expect(screen.getByTestId("bloque-lista-devoluciones")).toBeTruthy();
    expect(screen.getByText("Solicitud DEV-2026-0042")).toBeTruthy();
    expect(screen.getAllByText("21/11/2026 12:00").length).toBe(2);
    expect(screen.getAllByText("Talla incorrecta").length).toBe(2);
    expect(screen.getByText("En evaluación")).toBeTruthy();
    expect(screen.getByText("PROGRAMADO")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "VER SOLICITUD" })[1]);
    expect(onAction).toHaveBeenCalledWith({ id: "CONSULTAR_DEVOLUCION", etiqueta: "Ver solicitud", payload: { devolucionId: "DEV-2026-0050" } });
  });

  it("ESTADO_DEVOLUCION muestra la resolución y el reembolso sin reformular", () => {
    const fundamento = "La talla enviada no coincide con la solicitada; se aprueba el reembolso completo.";
    bubble([{
      id: "ed",
      tipo: "ESTADO_DEVOLUCION",
      datos: {
        ...DEVOLUCION,
        estado: "APROBADA",
        estadoEtiqueta: "Aprobada",
        resolucion: {
          fundamento,
          reembolso: {
            reembolsoId: "REB-2026-0007",
            estado: "PROGRAMADO",
            monto: 129.9,
            moneda: "PEN",
            fechaEjecucion: "2026-11-30",
          },
        },
      },
    }]);

    expect(screen.getByTestId("bloque-estado-devolucion")).toBeTruthy();
    expect(screen.getByText(fundamento)).toBeTruthy();
    expect(screen.getByTestId("bloque-reembolso")).toBeTruthy();
    expect(screen.getByText("S/ 129.90")).toBeTruthy();
    expect(screen.getByText("REB-2026-0007")).toBeTruthy();
    expect(screen.getByText("2026-11-30")).toBeTruthy();
    expect(screen.queryByText("Tu reembolso está en proceso.")).toBeNull();
  });

  it("ESTADO_DEVOLUCION sin reembolso no inventa monto ni fecha", () => {
    bubble([{
      id: "ed2",
      tipo: "ESTADO_DEVOLUCION",
      datos: {
        ...DEVOLUCION,
        estado: "APROBADA",
        estadoEtiqueta: "Aprobada",
        resolucion: { fundamento: "Cumple la política de devolución." },
      },
    }]);

    expect(screen.getByText("Aprobada")).toBeTruthy();
    expect(screen.getByText("Tu reembolso está en proceso.")).toBeTruthy();
    expect(screen.queryByTestId("bloque-reembolso")).toBeNull();
    expect(screen.queryByText(/S\/ \d/)).toBeNull();
  });

  it("CONSTANCIA_DEVOLUCION muestra la solicitud registrada y el código", () => {
    bubble([{
      id: "cd",
      tipo: "CONSTANCIA_DEVOLUCION",
      datos: { ...DEVOLUCION, tipo: "CAMBIO" },
    }]);

    expect(screen.getByTestId("bloque-constancia-devolucion")).toBeTruthy();
    expect(screen.getByText("Solicitud DEV-2026-0042")).toBeTruthy();
    expect(screen.getByText("CAMBIO")).toBeTruthy();
    expect(screen.getByText("Guarda este código para consultar tu solicitud.")).toBeTruthy();
  });

  it("un tipo desconocido sigue sin renderizarse", () => {
    bubble([{ id: "futuro", tipo: "BLOQUE_FUTURO" } as unknown as Bloque]);
    expect(document.querySelectorAll("[data-testid^='bloque-']").length).toBe(0);
  });
});

describe("formularios de autenticación en el chat", () => {
  it("FORMULARIO/LOGIN abre el AuthModal global", () => {
    bubble([{ id: "fl", tipo: "FORMULARIO", formulario: "LOGIN" }]);
    expect(screen.getByTestId("bloque-formulario-login")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "INICIAR SESIÓN" }));
    expect(useChatStore.getState().authOpen).toBe(true);
  });

  it("FORMULARIO/REENVIO_VERIFICACION reenvía con el mismo mensaje neutro", async () => {
    bubble([{ id: "fr", tipo: "FORMULARIO", formulario: "REENVIO_VERIFICACION" }]);
    expect(screen.getByTestId("bloque-formulario-reenvio")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@ejemplo.pe" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "ENVIARME UN ENLACE NUEVO" }));
    });
    await waitFor(() => expect(h.reenviar).toHaveBeenCalledWith("ana@ejemplo.pe"));
    expect(await screen.findByText(/Si hay una cuenta pendiente con ese correo/)).toBeTruthy();
  });
});

describe("formularios de postventa en el chat", () => {
  it("FORMULARIO/RECLAMO prellena y envía CONFIRMAR_RECLAMO", async () => {
    const onAction = vi.fn().mockResolvedValue(undefined);
    const descripcion = "La suela se despegó al primer uso y no puedo usarla";
    bubble([
      {
        id: "freclamo",
        tipo: "FORMULARIO",
        formulario: "RECLAMO",
        datos: {
          pedidoId: "PED-2026-00891",
          tipo: "QUEJA",
          motivo: "ATENCION_INADECUADA",
          descripcion,
          pedidoCliente: "Juan Pérez",
        },
      },
    ], onAction);

    expect(screen.getByTestId("bloque-formulario-reclamo")).toBeTruthy();
    expect((screen.getByLabelText("Queja") as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText("Motivo del reclamo") as HTMLSelectElement).value).toBe("ATENCION_INADECUADA");
    expect((screen.getByLabelText(/Descripción del reclamo/) as HTMLTextAreaElement).value).toBe(descripcion);
    fireEvent.change(screen.getByLabelText("Documento"), { target: { value: "72458912" } });
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR RECLAMO" }));

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1));
    expect(onAction).toHaveBeenCalledWith({
      id: "CONFIRMAR_RECLAMO",
      etiqueta: "Enviar reclamo",
      payload: expect.objectContaining({
        pedidoId: "PED-2026-00891",
        tipo: "QUEJA",
        motivo: "ATENCION_INADECUADA",
        descripcion,
        consumidor: {
          nombreCompleto: "Juan Pérez",
          documento: "72458912",
          email: "juan@example.com",
          telefono: "+51999888777",
        },
      }),
    });
  });

  it("FORMULARIO/DEVOLUCION prellena y envía CONFIRMAR_DEVOLUCION", async () => {
    const onAction = vi.fn().mockResolvedValue(undefined);
    const descripcion = "Compré la talla equivocada y necesito el cambio";
    bubble([
      {
        id: "fdevolucion",
        tipo: "FORMULARIO",
        formulario: "DEVOLUCION",
        datos: {
          pedidoId: "PED-2026-00891",
          tipo: "CAMBIO",
          motivo: "TALLA_INCORRECTA",
          descripcion,
          items: [{ productoId: "P-100", descripcion: "Zapatilla X 42/Negro", cantidad: 1 }],
        },
      },
    ], onAction);

    expect(screen.getByTestId("bloque-formulario-devolucion")).toBeTruthy();
    expect((screen.getByLabelText("Línea a devolver") as HTMLSelectElement).value).toBe("P-100");
    expect((screen.getByLabelText("Motivo") as HTMLSelectElement).value).toBe("TALLA_INCORRECTA");
    expect((screen.getByLabelText("Descripción") as HTMLTextAreaElement).value).toBe(descripcion);
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR SOLICITUD" }));

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1));
    expect(onAction).toHaveBeenCalledWith({
      id: "CONFIRMAR_DEVOLUCION",
      etiqueta: "Enviar solicitud",
      payload: expect.objectContaining({
        pedidoId: "PED-2026-00891",
        tipo: "CAMBIO",
        motivo: "TALLA_INCORRECTA",
        descripcion,
        items: [{ productoId: "P-100", cantidad: 1 }],
        evidencias: [],
      }),
    });
    expect(h.subirEvidencia).not.toHaveBeenCalled();
  });
});
