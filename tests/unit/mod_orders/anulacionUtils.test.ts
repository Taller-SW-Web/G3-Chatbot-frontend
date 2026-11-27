import { describe, it, expect } from "vitest";
import {
  resolverInfoAnulacion,
  esMotivoFaltaStock,
} from "@/modules/mod-orders/domain/utils/anulacionUtils";

describe("anulacionUtils", () => {
  describe("esMotivoFaltaStock", () => {
    it("detecta variantes de falta de stock", () => {
      expect(esMotivoFaltaStock("STOCK_NO_DISPONIBLE")).toBe(true);
      expect(esMotivoFaltaStock("FALTA DE STOCK")).toBe(true);
      expect(esMotivoFaltaStock("Producto agotado por stock")).toBe(true);
      expect(esMotivoFaltaStock(null, "Sin stock disponible")).toBe(true);
    });

    it("retorna false para otros motivos o valores vacíos", () => {
      expect(esMotivoFaltaStock(null, null)).toBe(false);
      expect(esMotivoFaltaStock("", "")).toBe(false);
      expect(esMotivoFaltaStock("PAGO_NO_COMPLETADO")).toBe(false);
      expect(esMotivoFaltaStock("CLIENTE_DESISTIO")).toBe(false);
    });
  });

  describe("resolverInfoAnulacion", () => {
    it("retorna estado no anulado para pedidos activos o entregados", () => {
      const res = resolverInfoAnulacion({ estado: "PAGADO" });
      expect(res.esAnulado).toBe(false);
      expect(res.esFaltaStock).toBe(false);
      expect(res.tituloMotivo).toBe("");
    });

    it("retorna anulación por falta de stock cuando el motivo explícito es de stock", () => {
      const res = resolverInfoAnulacion({
        estado: "ANULADO",
        motivo: "STOCK_NO_DISPONIBLE",
      });
      expect(res.esAnulado).toBe(true);
      expect(res.esFaltaStock).toBe(true);
      expect(res.tituloMotivo).toBe("Anulado por falta de stock");
      expect(res.descripcionMotivo).toContain("no hay stock disponible");
      expect(res.reembolsoTexto).toContain("medio de pago original");
    });

    it("aplica fallback neutro 'Anulado' cuando no hay motivo, sin asumir falta de stock", () => {
      const res = resolverInfoAnulacion({
        estado: "ANULADO",
        estadoEtiqueta: "Anulado",
      });
      expect(res.esAnulado).toBe(true);
      expect(res.esFaltaStock).toBe(false);
      expect(res.tituloMotivo).toBe("Anulado");
      expect(res.descripcionMotivo).toBe("El pedido fue anulado.");
      expect(res.reembolsoTexto).toContain("medio de pago original");
    });

    it("respeta otros motivos de anulación como PAGO_NO_COMPLETADO", () => {
      const res = resolverInfoAnulacion({
        estado: "ANULADO",
        motivo: "PAGO_NO_COMPLETADO",
      });
      expect(res.esAnulado).toBe(true);
      expect(res.esFaltaStock).toBe(false);
      expect(res.tituloMotivo).toBe("Pago no completado");
      expect(res.descripcionMotivo).toContain("Pago no completado");
    });

    it("formatea el reembolso cuando viene como objeto estructurado", () => {
      const res = resolverInfoAnulacion({
        estado: "ANULADO",
        motivo: "STOCK_NO_DISPONIBLE",
        reembolso: {
          monto: 150.5,
          moneda: "PEN",
          estado: "PROCESADO",
        },
      });
      expect(res.reembolsoTexto).toBe("Reembolso de S/ 150.50 (procesado) al medio de pago original.");
    });
  });
});
