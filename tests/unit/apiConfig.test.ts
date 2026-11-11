import { afterEach, describe, expect, it, vi } from "vitest";

const CLAVE = "NEXT_PUBLIC_API_BASE_URL";

async function cargarBaseUrl(): Promise<string> {
  vi.resetModules();
  const { apiConfig } = await import("@/infrastructure/config/apiConfig");
  return apiConfig.baseUrl;
}

afterEach(() => {
  delete process.env[CLAVE];
  vi.resetModules();
});

describe("apiConfig.baseUrl", () => {
  it("usa el mismo origen si la variable no está definida", async () => {
    delete process.env[CLAVE];
    expect(await cargarBaseUrl()).toBe("/api/v1");
  });

  it("usa el mismo origen si la variable está vacía", async () => {
    process.env[CLAVE] = "";
    expect(await cargarBaseUrl()).toBe("/api/v1");
  });

  it("respeta un origen explícito", async () => {
    process.env[CLAVE] = "https://api.example.com/v1";
    expect(await cargarBaseUrl()).toBe("https://api.example.com/v1");
  });
});
