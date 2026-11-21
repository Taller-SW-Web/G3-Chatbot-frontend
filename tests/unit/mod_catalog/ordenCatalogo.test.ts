import { describe, expect, it } from "vitest";
import {
  ORDEN_CATALOGO_POR_DEFECTO,
  OPCIONES_ORDEN_CATALOGO,
  ordenParaApi,
} from "@/modules/mod-catalog/domain/entities/OrdenCatalogo";

describe("orden del catálogo (SPEC-06)", () => {
  it("no envía el orden por defecto y sí los explícitos", () => {
    expect(ORDEN_CATALOGO_POR_DEFECTO).toBe("relevancia");
    expect(ordenParaApi("relevancia")).toBeUndefined();
    expect(ordenParaApi("precio_asc")).toBe("precio_asc");
    expect(ordenParaApi("precio_desc")).toBe("precio_desc");
    expect(ordenParaApi("nombre_asc")).toBe("nombre_asc");
    expect(ordenParaApi("nombre_desc")).toBe("nombre_desc");
  });

  it("expone las cinco opciones del selector", () => {
    expect(OPCIONES_ORDEN_CATALOGO.map((o) => o.value)).toEqual([
      "relevancia",
      "precio_asc",
      "precio_desc",
      "nombre_asc",
      "nombre_desc",
    ]);
  });
});
