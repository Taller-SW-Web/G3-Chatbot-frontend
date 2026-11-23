import { describe, expect, it } from "vitest";
import {
  RECLAMO_MOTIVO_VALUES,
  RECLAMO_MOTIVOS,
  reclamoSchema,
} from "@/modules/mod-postventa/domain/schemas/reclamo.schema";

const BASE = {
  pedidoId: "PED-2026-00891",
  tipo: "RECLAMO" as const,
  motivo: "PRODUCTO_DEFECTUOSO_O_INCORRECTO" as const,
  descripcion: "El producto llegó con la suela despegada y no puedo usarlo.",
  documento: "12345678",
  telefono: "+51999888777",
};

describe("reclamoSchema", () => {
  it("acepta exactamente los 5 motivos de G5 y no incluye OTRO", () => {
    expect(RECLAMO_MOTIVO_VALUES).toHaveLength(5);
    expect(RECLAMO_MOTIVO_VALUES).toEqual([
      "INCUMPLIMIENTO_PLAZO_ENTREGA",
      "PRODUCTO_DEFECTUOSO_O_INCORRECTO",
      "COBRO_INDEBIDO_O_NO_RECONOCIDO",
      "ATENCION_INADECUADA",
      "INCUMPLIMIENTO_GARANTIA",
    ]);
    expect(RECLAMO_MOTIVO_VALUES).not.toContain("OTRO");
    expect(RECLAMO_MOTIVOS.map((m) => m.value)).toEqual([...RECLAMO_MOTIVO_VALUES]);
  });

  it.each(RECLAMO_MOTIVO_VALUES)("acepta el motivo %s", (motivo) => {
    expect(reclamoSchema.safeParse({ ...BASE, motivo }).success).toBe(true);
  });

  it.each(["OTRO", "PRODUCTO_DEFECTUOSO", "PRODUCTO_EQUIVOCADO", "ATENCION"])(
    "rechaza el motivo fuera de la lista %s",
    (motivo) => {
      expect(reclamoSchema.safeParse({ ...BASE, motivo }).success).toBe(false);
    }
  );

  it("exige un detalle de al menos 20 caracteres", () => {
    expect(reclamoSchema.safeParse({ ...BASE, descripcion: "Muy corto" }).success).toBe(false);
  });
});
