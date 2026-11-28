import { describe, it, expect } from "vitest";
import {
  resolverInfoAnulacion,
  esMotivoFaltaStock,
  sanitizarMotivoHito,
} from "@/modules/mod-orders/domain/utils/anulacionUtils";

describe("anulacionUtils", () => {
  describe("esMotivoFaltaStock", () => {
    it("detecta variantes de falta de stock", () => {
      expect(esMotivoFaltaStock("STOCK_NO_DISPONIBLE")).toBe(true);
      expect(esMotivoFaltaStock("FALTA_DE_STOCK")).toBe(true);
      expect(esMotivoFaltaStock("Producto agotado por falta de stock")).toBe(true);
    });

    it("retorna false para otros motivos o valores vacíos", () => {
      expect(esMotivoFaltaStock(null)).toBe(false);
      expect(esMotivoFaltaStock("")).toBe(false);
      expect(esMotivoFaltaStock("PAGO_NO_COMPLETADO")).toBe(false);
      expect(esMotivoFaltaStock("SOLICITUD_CLIENTE")).toBe(false);
    });
  });

  describe("sanitizarMotivoHito", () => {
    it("mapea motivos conocidos a etiquetas humanas", () => {
      expect(sanitizarMotivoHito("STOCK_NO_DISPONIBLE")).toBe("Falta de stock");
      expect(sanitizarMotivoHito("PAGO_NO_COMPLETADO")).toBe("Pago no completado");
      expect(sanitizarMotivoHito("SOLICITUD_CLIENTE")).toBe("Solicitud del cliente");
    });

    it("suprime texto interno arbitrario para motivos desconocidos (SPEC-17 :123-126)", () => {
      expect(sanitizarMotivoHito("ERR_DB_TIMEOUT_RETRY_3")).toBeNull();
      expect(sanitizarMotivoHito("some arbitrary internal error")).toBeNull();
      expect(sanitizarMotivoHito(null)).toBeNull();
    });
  });

  describe("resolverInfoAnulacion", () => {
    it("retorna estado no anulado para pedidos activos o entregados", () => {
      const res = resolverInfoAnulacion({ estado: "PAGADO" });
      expect(res.esAnulado).toBe(false);
      expect(res.esFaltaStock).toBe(false);
      expect(res.tituloMotivo).toBe("");
      expect(res.reembolsoTexto).toBeNull();
    });

    it("retorna anulación por falta de stock y fecha cuando el motivo explícito es de stock (SPEC-17 :111)", () => {
      const res = resolverInfoAnulacion({
        estado: "ANULADO",
        fechaCreacion: "2026-11-02T10:00:00Z",
        motivoAnulacion: "STOCK_NO_DISPONIBLE",
        reembolso: "Si corresponde un reembolso, se procesará al medio de pago original.",
        historial: [
          { estado: "ANULADO", fecha: "2026-11-02T10:05:00Z", motivo: "STOCK_NO_DISPONIBLE" },
        ],
      });
      expect(res.esAnulado).toBe(true);
      expect(res.esFaltaStock).toBe(true);
      expect(res.tituloMotivo).toContain("Anulado el");
      expect(res.descripcionMotivo).toContain("no hay stock disponible");
      expect(res.reembolsoTexto).toBe("Si corresponde un reembolso, se procesará al medio de pago original.");
    });

    it("no promete reembolso si no hay registro de reembolso/pago (SPEC-17 :119-121)", () => {
      const res = resolverInfoAnulacion({
        estado: "ANULADO",
        motivoAnulacion: "STOCK_NO_DISPONIBLE",
        reembolso: null,
      });
      expect(res.esAnulado).toBe(true);
      expect(res.reembolsoTexto).toBeNull();
    });

    it("aplica fallback neutro 'Anulado' cuando no hay motivo, sin asumir falta de stock", () => {
      const res = resolverInfoAnulacion({
        estado: "ANULADO",
        estadoEtiqueta: "Anulado",
      });
      expect(res.esAnulado).toBe(true);
      expect(res.esFaltaStock).toBe(false);
      expect(res.descripcionMotivo).toBe("El pedido fue anulado.");
    });

    it("sanitiza motivos desconocidos sin filtrar texto interno (SPEC-17 :123-126)", () => {
      const res = resolverInfoAnulacion({
        estado: "ANULADO",
        motivoAnulacion: "INTERNAL_GATEWAY_TIMEOUT_CODE_504",
      });
      expect(res.esAnulado).toBe(true);
      expect(res.esFaltaStock).toBe(false);
      expect(res.descripcionMotivo).toBe("El pedido fue anulado.");
    });
  });
});
