// @vitest-environment jsdom
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
  return Promise.reject(new AxiosError(`HTTP ${status}`, "ERR_BAD_REQUEST", config, null, response));
}

let handler: Handler;
const calls: Array<{ url?: string; method?: string; data?: unknown }> = [];

const adapter: AxiosAdapter = (config) => {
  calls.push({ url: config.url, method: config.method, data: config.data });
  return handler(config);
};

axios.defaults.adapter = adapter;

const { container } = await import("@/shared/di/container");

const archivo = new File([new Uint8Array([1, 2, 3])], "foto.png", { type: "image/png" });

describe("adjuntos del chat en el adapter REST (SPEC-23)", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("sube la imagen como multipart al endpoint de la conversación", async () => {
    handler = (config) =>
      reply(config, 201, {
        adjuntoId: "a-1",
        mimeType: "image/png",
        tamanioBytes: 3,
        ancho: 10,
        alto: 10,
      });

    const adjunto = await container.chat.subirAdjunto("c-1", archivo);

    expect(adjunto).toMatchObject({ adjuntoId: "a-1", mimeType: "image/png", ancho: 10 });
    expect(calls[0].url).toBe("/chat/conversaciones/c-1/adjuntos");
    expect(calls[0].data).toBeInstanceOf(FormData);
    expect((calls[0].data as FormData).get("archivo")).toBeInstanceOf(File);
  });

  it("normaliza aliases snake_case de la respuesta", async () => {
    handler = (config) =>
      reply(config, 201, {
        id: "a-2",
        mime_type: "image/webp",
        size_bytes: 120,
        url_miniatura: "https://firmada/mini",
      });

    const adjunto = await container.chat.subirAdjunto("c-1", archivo);
    expect(adjunto).toMatchObject({
      adjuntoId: "a-2",
      mimeType: "image/webp",
      tamanioBytes: 120,
      urlMiniatura: "https://firmada/mini",
    });
  });

  it("elimina el pendiente y emite una URL firmada nueva", async () => {
    handler = (config) => reply(config, config.method === "delete" ? 204 : 200, {
      urlMiniatura: "https://firmada/nueva",
      urlImagen: "https://firmada/nueva-full",
      expiraEn: "2026-11-20T12:00:00Z",
    });

    await container.chat.eliminarAdjunto("c-1", "a-1");
    const urls = await container.chat.obtenerUrlAdjunto("a-1");

    expect(calls[0]).toMatchObject({ method: "delete", url: "/chat/conversaciones/c-1/adjuntos/a-1" });
    expect(calls[1]).toMatchObject({ method: "get", url: "/chat/adjuntos/a-1" });
    expect(urls.urlImagen).toBe("https://firmada/nueva-full");
  });
});
