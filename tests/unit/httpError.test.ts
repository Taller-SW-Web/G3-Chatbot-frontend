import { describe, it, expect } from "vitest";
import { httpStatus, isUnavailable, problemCode } from "@/domain/utils/httpError";

describe("lectura de problem+json (SPEC-06, SPEC-09)", () => {
  it("lee status y code del adapter", () => {
    const err = { response: { status: 409, data: { code: "PRODUCTO_NO_DISPONIBLE" } } };
    expect(httpStatus(err)).toBe(409);
    expect(problemCode(err)).toBe("PRODUCTO_NO_DISPONIBLE");
  });

  it("sin respuesta = fallo de red (no disponible)", () => {
    expect(httpStatus({ message: "Network Error" })).toBeUndefined();
    expect(isUnavailable({ message: "Network Error" })).toBe(true);
  });

  it("503 y SERVICIO_NO_DISPONIBLE cuentan como no disponible", () => {
    expect(isUnavailable({ response: { status: 503, data: {} } })).toBe(true);
    expect(
      isUnavailable({ response: { status: 500, data: { code: "SERVICIO_NO_DISPONIBLE" } } })
    ).toBe(true);
    expect(isUnavailable({ response: { status: 404, data: { code: "RECURSO_NO_ENCONTRADO" } } })).toBe(false);
  });
});
