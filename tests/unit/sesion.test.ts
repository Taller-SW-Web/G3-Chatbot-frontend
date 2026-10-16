import { describe, it, expect } from "vitest";
import { loginSchema } from "@/domain/schemas/login.schema";
import { otpMfaSchema } from "@/domain/schemas/otpMfa.schema";
import { isTokenExpiringSoon, buildLoginGreeting } from "@/domain/utils/sesion";

describe("session contracts (SPEC-03)", () => {
  it("login schema accepts email and password", () => {
    const r = loginSchema.safeParse({ correo: "a@b.pe", password: "secret123" });
    expect(r.success).toBe(true);
  });

  it("login schema rejects invalid email", () => {
    const r = loginSchema.safeParse({ correo: "no-email", password: "secret123" });
    expect(r.success).toBe(false);
  });

  it("mfa schema accepts six digits", () => {
    expect(otpMfaSchema.safeParse({ codigo: "123456" }).success).toBe(true);
  });

  it("mfa schema rejects short codes", () => {
    expect(otpMfaSchema.safeParse({ codigo: "123" }).success).toBe(false);
  });

  it("token expiring within sixty seconds needs refresh", () => {
    const now = Date.now();
    expect(isTokenExpiringSoon(now + 30 * 1000, now)).toBe(true);
    expect(isTokenExpiringSoon(now + 10 * 60 * 1000, now)).toBe(false);
    expect(isTokenExpiringSoon(null, now)).toBe(false);
  });

  it("login greeting uses first name", () => {
    expect(buildLoginGreeting("Maria Torres")).toBe("Hola, Maria");
    expect(buildLoginGreeting(null)).toBe("Hola");
  });
});
