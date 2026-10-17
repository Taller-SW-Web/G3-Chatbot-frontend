import { beforeEach, describe, expect, it } from "vitest";
import axios, {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

type Handler = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;

function reply(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown
): Promise<AxiosResponse> {
  const response = { data, status, statusText: "", headers: {}, config } as AxiosResponse;
  if (status >= 200 && status < 300) return Promise.resolve(response);
  return Promise.reject(
    new AxiosError(`HTTP ${status}`, "ERR_BAD_REQUEST", config, null, response)
  );
}

let handler: Handler;
const calls: Array<{ url?: string; auth?: unknown; data?: unknown }> = [];

const adapter: AxiosAdapter = (config) => {
  calls.push({ url: config.url, auth: config.headers.Authorization, data: config.data });
  return handler(config);
};

// El adapter crea su instancia de axios al importarse: se reemplaza el
// transporte antes de importarlo (mismo patrón que chatbotApiInterceptor.test).
axios.defaults.adapter = adapter;

const { chatbotApi } = await import("@/adapters/outbound/ChatbotApiAxiosAdapter");
const { useChatStore } = await import("@/application/state/chatStore");
const { clearPoliticaContrasenaCache } = await import("@/domain/utils/passwordPolicy");

const countOf = (url: string) => calls.filter((c) => c.url === url).length;
const bodyOf = (url: string) =>
  JSON.parse(String(calls.find((c) => c.url === url)?.data ?? "{}"));

describe("registro en el adapter REST (SPEC-01)", () => {
  beforeEach(() => {
    calls.length = 0;
    clearPoliticaContrasenaCache();
    useChatStore.getState().applySession("token-vivo", 900);
  });

  it("envía el contrato camelCase del BFF y nunca el Authorization (ruta pública)", async () => {
    handler = (config) => reply(config, 201, { estado: "PENDIENTE", correoEnmascarado: "a****@x.com" });

    const resultado = await chatbotApi.registrar({
      nombres: "Ana",
      apellidos: "Quispe",
      correo: "ana@ejemplo.com",
      celular: "+51987654321",
      contrasena: "secreto123",
      aceptaTerminos: true,
    });

    expect(resultado.correoEnmascarado).toBe("a****@x.com");
    expect(countOf("/sesion/registro")).toBe(1);
    expect(bodyOf("/sesion/registro")).toEqual({
      email: "ana@ejemplo.com",
      password: "secreto123",
      phone: "+51987654321",
      firstName: "Ana",
      lastName: "Quispe",
      acceptTerms: true,
    });
    expect(calls[0].auth).toBeUndefined();
  });

  it("propaga el 409 para que la UI no revele si el correo existe", async () => {
    handler = (config) => reply(config, 409, { code: "CORREO_NO_DISPONIBLE" });

    await expect(
      chatbotApi.registrar({
        nombres: "Ana",
        apellidos: "Quispe",
        correo: "ana@ejemplo.com",
        celular: "+51987654321",
        contrasena: "secreto123",
        aceptaTerminos: true,
      })
    ).rejects.toMatchObject({ response: { status: 409 } });
  });
});

describe("errores por campo del registro (SPEC-01 Req. 4)", () => {
  const entrada = {
    nombres: "Ana",
    apellidos: "Quispe",
    correo: "ana@ejemplo.com",
    celular: "+51987654321",
    contrasena: "secreto123",
    aceptaTerminos: true as const,
  };

  it("propaga errores[] del 400 VALIDACION y del 422 POLITICA_INCUMPLIDA", async () => {
    handler = (config) =>
      reply(config, 400, { code: "VALIDACION", errores: [{ campo: "email", mensaje: "Correo inválido" }] });
    await expect(chatbotApi.registrar(entrada)).rejects.toMatchObject({
      response: { status: 400, data: { errores: [{ campo: "email", mensaje: "Correo inválido" }] } },
    });

    handler = (config) =>
      reply(config, 422, {
        code: "POLITICA_INCUMPLIDA",
        errores: [{ campo: "password", mensaje: "Debe incluir un número" }],
      });
    await expect(chatbotApi.registrar(entrada)).rejects.toMatchObject({
      response: { status: 422, data: { errores: [{ campo: "password", mensaje: "Debe incluir un número" }] } },
    });
  });
});

describe("política de contraseña en el adapter (SPEC-01 Req. 2)", () => {
  beforeEach(() => {
    calls.length = 0;
    clearPoliticaContrasenaCache();
  });

  it("pide la política una vez y reutiliza la caché", async () => {
    handler = (config) => reply(config, 200, { minLength: 10, requireDigit: true });

    const primera = await chatbotApi.obtenerPoliticaContrasena();
    const segunda = await chatbotApi.obtenerPoliticaContrasena();

    expect(primera).toEqual({ minLength: 10, requireDigit: true });
    expect(segunda).toBe(primera);
    expect(countOf("/sesion/politica-contrasena")).toBe(1);
  });
});

describe("verificación de correo en el adapter (SPEC-02)", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("canjea el token por POST /sesion/verificar-correo sin Authorization", async () => {
    useChatStore.getState().applySession("token-vivo", 900);
    handler = (config) => reply(config, 204, undefined);

    await chatbotApi.verificarCorreo("tok-123");

    expect(countOf("/sesion/verificar-correo")).toBe(1);
    expect(bodyOf("/sesion/verificar-correo")).toEqual({ token: "tok-123" });
    expect(calls[0].auth).toBeUndefined();
  });

  it("reenvía el enlace con el correo en el cuerpo", async () => {
    handler = (config) => reply(config, 202, { ok: true });

    const resultado = await chatbotApi.reenviarVerificacion("ana@ejemplo.com");

    expect(resultado).toEqual({ ok: true });
    expect(countOf("/sesion/verificar-correo/reenviar")).toBe(1);
    expect(bodyOf("/sesion/verificar-correo/reenviar")).toEqual({ email: "ana@ejemplo.com" });
  });
});
