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
