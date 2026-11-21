// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const peticiones = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: peticiones.get,
      post: peticiones.post,
      patch: peticiones.patch,
      delete: peticiones.delete,
      interceptors: {
        request: { use: () => {} },
        response: { use: () => {} },
      },
    }),
    isAxiosError: (e: unknown) => Boolean((e as { response?: unknown } | null)?.response),
  },
}));

import { container } from "@/shared/di/container";

const chatbotApi = container.api;

const DEVOLUCION = {
  pedidoId: "PED-2026-00002",
  tipo: "CAMBIO" as const,
  motivo: "TALLA_INCORRECTA",
  items: [{ productoId: "P-100", cantidad: 1 }],
};

const RECLAMO = {
  pedidoId: "PED-2026-00002",
  tipo: "RECLAMO" as const,
  motivo: "PRODUCTO_DEFECTUOSO",
  detalle: "El producto llegó defectuoso y no funciona correctamente.",
  consumidor: {
    nombreCompleto: "Ana Pérez",
    documento: "12345678",
    email: "ana@example.com",
    telefono: "+51999888777",
  },
};

describe("adapter Axios de pedidos y postventa", () => {
  beforeEach(() => {
    peticiones.get.mockReset();
    peticiones.post.mockReset();
    peticiones.patch.mockReset();
    peticiones.delete.mockReset();
  });

  it("lista pedidos con paginación y estado", async () => {
    peticiones.get.mockResolvedValueOnce({ data: { items: [], total: 0 } });
    await chatbotApi.listarPedidos({ page: 2, pageSize: 5, estado: "PAGADO" });

    expect(peticiones.get).toHaveBeenCalledWith("/pedidos", {
      params: { page: 2, pageSize: 5, estado: "PAGADO" },
    });
  });

  it("usa los defaults de paginación de pedidos", async () => {
    peticiones.get.mockResolvedValueOnce({ data: { items: [], total: 0 } });
    await chatbotApi.listarPedidos();

    expect(peticiones.get).toHaveBeenCalledWith("/pedidos", {
      params: { page: 1, pageSize: 10 },
    });
  });

  it("obtiene pedido y seguimiento con el id codificado", async () => {
    peticiones.get
      .mockResolvedValueOnce({ data: { pedidoId: "PED/1" } })
      .mockResolvedValueOnce({ data: { pedidoId: "PED/1" } });

    await chatbotApi.obtenerPedido("PED/1");
    await chatbotApi.obtenerSeguimientoPedido("PED/1");

    expect(peticiones.get).toHaveBeenNthCalledWith(1, "/pedidos/PED%2F1");
    expect(peticiones.get).toHaveBeenNthCalledWith(2, "/pedidos/PED%2F1/seguimiento");
  });

  it("sube evidencia como multipart con conversación opcional", async () => {
    peticiones.post.mockResolvedValueOnce({ data: { url: "https://example.test/e.jpg" } });
    const file = new File(["foto"], "e.jpg", { type: "image/jpeg" });

    await chatbotApi.subirEvidencia(file, "conv/1");

    const form = peticiones.post.mock.calls[0][1] as FormData;
    expect(peticiones.post.mock.calls[0][0]).toBe("/evidencias");
    expect(form.get("file")).toBe(file);
    expect(form.get("conversacionId")).toBe("conv/1");
  });

  it("crea devoluciones con Idempotency-Key", async () => {
    peticiones.post.mockResolvedValueOnce({ data: { devolucionId: "DEV-1" } });
    await chatbotApi.crearDevolucion(DEVOLUCION, "idem-dev");

    expect(peticiones.post).toHaveBeenCalledWith("/devoluciones", DEVOLUCION, {
      headers: { "Idempotency-Key": "idem-dev" },
    });
  });

  it("lista y obtiene devoluciones con filtros y id codificado", async () => {
    peticiones.get
      .mockResolvedValueOnce({ data: { items: [], total: 0 } })
      .mockResolvedValueOnce({ data: { devolucionId: "DEV/1" } });

    await chatbotApi.listarDevoluciones({ page: 2, pageSize: 5, estado: "SOLICITADA", tipo: "CAMBIO" });
    await chatbotApi.obtenerDevolucion("DEV/1");

    expect(peticiones.get).toHaveBeenNthCalledWith(1, "/devoluciones", {
      params: { page: 2, pageSize: 5, estado: "SOLICITADA", tipo: "CAMBIO" },
    });
    expect(peticiones.get).toHaveBeenNthCalledWith(2, "/devoluciones/DEV%2F1");
  });

  it("crea reclamos con Idempotency-Key", async () => {
    peticiones.post.mockResolvedValueOnce({ data: { codigoSeguimiento: "REC-1" } });
    await chatbotApi.crearReclamo(RECLAMO, "idem-rec");

    expect(peticiones.post).toHaveBeenCalledWith("/reclamos", RECLAMO, {
      headers: { "Idempotency-Key": "idem-rec" },
    });
  });

  it("lista y obtiene reclamos con filtros y código codificado", async () => {
    peticiones.get
      .mockResolvedValueOnce({ data: { items: [], total: 0 } })
      .mockResolvedValueOnce({ data: { codigoSeguimiento: "REC/1" } });

    await chatbotApi.listarReclamos({ page: 2, pageSize: 5, estado: "REGISTRADO" });
    await chatbotApi.obtenerReclamo("REC/1");

    expect(peticiones.get).toHaveBeenNthCalledWith(1, "/reclamos", {
      params: { page: 2, pageSize: 5, estado: "REGISTRADO" },
    });
    expect(peticiones.get).toHaveBeenNthCalledWith(2, "/reclamos/REC%2F1");
  });

  it("califica un pedido entregado", async () => {
    peticiones.post.mockResolvedValueOnce({ data: undefined });
    await chatbotApi.calificarPedido("PED/1", 5, "Excelente");

    expect(peticiones.post).toHaveBeenCalledWith("/pedidos/PED%2F1/csat", {
      puntuacion: 5,
      comentario: "Excelente",
    });
  });

  it("inicia, consulta y paga un checkout con idempotencia", async () => {
    peticiones.post
      .mockResolvedValueOnce({ data: { id: "chk-1" } })
      .mockResolvedValueOnce({ data: { orderId: "PED-1" } });
    peticiones.get.mockResolvedValueOnce({ data: { id: "chk-1" } });
    const checkout = { direccion: { distrito: "Miraflores" } };

    await chatbotApi.iniciarCheckout(checkout, "idem-chk");
    await chatbotApi.obtenerCheckout("chk/1");
    await chatbotApi.pagarCheckout(
      "chk/1",
      { numeroTarjeta: "4111111111111111", titular: "ANA", vencimiento: "12/30", cvv: "123" },
      "idem-pay"
    );

    expect(peticiones.post).toHaveBeenNthCalledWith(1, "/checkout", checkout, {
      headers: { "Idempotency-Key": "idem-chk" },
    });
    expect(peticiones.get).toHaveBeenCalledWith("/checkout/chk%2F1");
    expect(peticiones.post).toHaveBeenNthCalledWith(
      2,
      "/checkout/chk%2F1/pago",
      expect.objectContaining({ numeroTarjeta: "4111111111111111" }),
      expect.objectContaining({
        headers: { "Idempotency-Key": "idem-pay" },
        timeout: 30000,
      })
    );
  });
});
