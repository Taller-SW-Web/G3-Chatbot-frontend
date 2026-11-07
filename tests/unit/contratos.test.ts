import { describe, it, expect } from "vitest";
import { direccionSchema } from "@/domain/schemas/direccion.schema";
import { pagoSchema } from "@/domain/schemas/pago.schema";
import { sanitize, maskEmail } from "@/domain/utils/sanitize";

describe("schemas + sanitize (contratos backend)", () => {
  it("direccion A14 DNI 8 dígitos", () => {
    const r = direccionSchema.safeParse({
      nombre: "Cliente Demo",
      direccion: "Av. Siempre Viva 742",
      distrito: "Miraflores",
      docTipo: "DNI",
      docNum: "12345678",
    });
    expect(r.success).toBe(true);
  });

  it.each([
    ["DNI", "123", "El DNI tiene 8 dígitos"],
    ["RUC", "12345678", "El RUC tiene 11 dígitos"],
    ["CE", "abc", "El CE o pasaporte tiene de 6 a 20 letras o números"],
    ["PASAPORTE", "abc!123", "El CE o pasaporte tiene de 6 a 20 letras o números"],
  ])("explica el documento inválido de tipo %s", (docTipo, docNum, message) => {
    const result = direccionSchema.safeParse({
      nombre: "Cliente Demo", direccion: "Av. Arequipa 123", distrito: "Miraflores", docTipo, docNum,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.find((issue) => issue.path[0] === "docNum")?.message).toBe(message);
  });

  it("pago solo tarjeta", () => {
    const r = pagoSchema.safeParse({
      tarjetaNum: "4111111111111111",
      vencimiento: "12/28",
      cvv: "123",
    });
    expect(r.success).toBe(true);
  });

  it("sanitize elimina tags y maskEmail enmascara", () => {
    expect(sanitize('<script>alert(1)</script>hola')).not.toContain("<script>");
    expect(maskEmail("cliente.demo@correo.com")).toBe("c****@correo.com");
  });
});
