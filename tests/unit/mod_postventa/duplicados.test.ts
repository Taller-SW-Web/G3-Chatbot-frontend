import { describe, expect, it } from "vitest";
import {
  esDevolucionDuplicada,
  esReclamoDuplicado,
  solicitudDuplicada,
} from "@/modules/mod-postventa/domain/utils/duplicados";

const error = (code: string, extra: Record<string, unknown> = {}) => ({
  response: { status: 409, data: { code, ...extra } },
});

describe("duplicados de postventa (SPEC-19, SPEC-21)", () => {
  it("reconoce cada código de duplicado", () => {
    expect(esReclamoDuplicado(error("RECLAMO_DUPLICADO"))).toBe(true);
    expect(esReclamoDuplicado(error("DEVOLUCION_DUPLICADA"))).toBe(false);
    expect(esDevolucionDuplicada(error("DEVOLUCION_DUPLICADA"))).toBe(true);
    expect(esDevolucionDuplicada(error("RECLAMO_DUPLICADO"))).toBe(false);
    expect(esReclamoDuplicado(new Error("sin red"))).toBe(false);
  });

  it("extrae el código existente de los campos donde lo publique el backend", () => {
    expect(solicitudDuplicada(error("RECLAMO_DUPLICADO", { codigoSeguimiento: "REC-1" })).codigo).toBe("REC-1");
    expect(solicitudDuplicada(error("DEVOLUCION_DUPLICADA", { devolucionId: "DEV-1" })).codigo).toBe("DEV-1");
    expect(solicitudDuplicada(error("RECLAMO_DUPLICADO", { codigo: "REC-2" })).codigo).toBe("REC-2");
    expect(solicitudDuplicada(error("RECLAMO_DUPLICADO")).codigo).toBe("");
  });
});
