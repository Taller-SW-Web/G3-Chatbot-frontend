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

const invalidToken = { code: "TOKEN_INVALIDO" };
const opened = { accessToken: "new-token", expiresIn: 900 };

let handler: Handler;
const calls: Array<{ url?: string; auth?: unknown }> = [];

const adapter: AxiosAdapter = (config) => {
  calls.push({ url: config.url, auth: config.headers.Authorization });
  return handler(config);
};

// The adapter module creates its axios instance at import time, so the
// transport must be replaced before it is imported.
axios.defaults.adapter = adapter;

const { chatbotApi } = await import("@/adapters/outbound/ChatbotApiAxiosAdapter");
const { useChatStore } = await import("@/application/state/chatStore");

const countOf = (url: string) => calls.filter((c) => c.url === url).length;

describe("401 refresh interceptor (SPEC-03 Req. 5)", () => {
  beforeEach(() => {
    calls.length = 0;
    useChatStore.getState().applySession("old-token", 900);
  });

  it("refreshes once on 401 TOKEN_INVALIDO and replays the original request once", async () => {
    handler = (config) => {
      if (config.url === "/sesion/refresh") return reply(config, 200, opened);
      if (config.headers.Authorization === "Bearer new-token") {
        return reply(config, 200, { nombre: "Maria" });
      }
      return reply(config, 401, invalidToken);
    };

    const profile = await chatbotApi.fetchProfile();

    expect(profile).toEqual({ nombre: "Maria" });
    expect(countOf("/sesion/refresh")).toBe(1);
    expect(countOf("/sesion/perfil")).toBe(2);
    expect(useChatStore.getState().accessToken).toBe("new-token");
  });

  it("shares a single refresh between concurrent 401s", async () => {
    handler = async (config) => {
      if (config.url === "/sesion/refresh") {
        await new Promise((r) => setTimeout(r, 10));
        return reply(config, 200, opened);
      }
      if (config.headers.Authorization === "Bearer new-token") {
        return reply(config, 200, { ok: true });
      }
      return reply(config, 401, invalidToken);
    };

    await Promise.all([chatbotApi.fetchProfile(), chatbotApi.fetchProfile()]);

    expect(countOf("/sesion/refresh")).toBe(1);
    expect(countOf("/sesion/perfil")).toBe(4);
  });

  it("does not loop when /sesion/refresh itself answers 401", async () => {
    handler = (config) => reply(config, 401, invalidToken);

    await expect(chatbotApi.refreshSession()).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(countOf("/sesion/refresh")).toBe(1);
  });

  it("logs out and propagates the original error when the refresh fails", async () => {
    handler = (config) => {
      if (config.url === "/sesion/refresh") {
        return reply(config, 401, { code: "REFRESCO_INVALIDO" });
      }
      return reply(config, 401, invalidToken);
    };

    await expect(chatbotApi.fetchProfile()).rejects.toMatchObject({
      response: { status: 401, data: invalidToken },
    });

    expect(countOf("/sesion/refresh")).toBe(1);
    expect(countOf("/sesion/perfil")).toBe(1);
    expect(useChatStore.getState().accessToken).toBeNull();
  });

  it("does not refresh when /sesion/mfa/verificar answers 401", async () => {
    handler = (config) => reply(config, 401, invalidToken);

    await expect(chatbotApi.verifyMfaCode("123456")).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(countOf("/sesion/refresh")).toBe(0);
    expect(countOf("/sesion/mfa/verificar")).toBe(1);
  });

  it("does not refresh on a 401 without the invalid-token code", async () => {
    handler = (config) => reply(config, 401, {});

    await expect(chatbotApi.fetchProfile()).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(countOf("/sesion/refresh")).toBe(0);
  });
});
