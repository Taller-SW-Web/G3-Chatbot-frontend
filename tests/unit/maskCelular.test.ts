import { describe, expect, it } from "vitest";
import { maskCelular } from "@/domain/utils/sanitize";

describe("maskCelular", () => {
  it.each([
    ["+51999123123", "+51 *****123"],
    ["+51 999123123", "+51 *****123"],
    ["999123123", "*****123"],
  ])("oculta el número %s", (numero, esperado) => {
    expect(maskCelular(numero)).toBe(esperado);
  });
});
