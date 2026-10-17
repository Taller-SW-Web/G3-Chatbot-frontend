"use client";

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { apiConfig } from "@/infrastructure/config/apiConfig";
import { useChatStore } from "@/application/state/chatStore";
import { createSingleFlight } from "@/domain/utils/singleFlight";
import type {
  ChatbotApiPort,
  ConversacionResumen,
  MfaChallenge,
  PerfilCliente,
  SessionOpened,
} from "@/ports/outbound/ChatbotApiPort";
import type { Mensaje } from "@/domain/entities/Mensaje";
import { MOCK_MENSAJES } from "./mockData";

/**
 * Adapter REST con interceptor JWT.
 * Si no hay backend (baseUrl localhost sin respuesta), usa mocks del wireframe
 * para que el equipo frontend/backend pueda trabajar sin bloquearse.
 * Ramifica por `code` problem+json.
 */
const http = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: apiConfig.timeouts.defecto,
  withCredentials: true,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

/** Endpoints públicos: nunca llevan `Authorization` ni disparan refresh (SPEC-03 Req. 1/5). */
const PUBLIC_PATHS = ["/sesion/login", "/sesion/refresh"];

function isPublic(path: string | undefined): boolean {
  return !!path && PUBLIC_PATHS.some((p) => path.includes(p));
}

http.interceptors.request.use((cfg) => {
  const token = useChatStore.getState().accessToken;
  if (token && !isPublic(cfg.url)) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

/** Single-flight refresh: concurrent calls share one promise (SPEC-03 Req. 5). */
async function doRefresh(): Promise<SessionOpened> {
  const { data } = await http.post("/sesion/refresh");
  return data as SessionOpened;
}

const refreshOnce = createSingleFlight(doRefresh);

function isInvalidToken(error: unknown): boolean {
  const status = (error as AxiosError)?.response?.status;
  const code = (error as AxiosError<{ code?: string }>)?.response?.data?.code;
  return status === 401 && (!code || code === "TOKEN_INVALIDO");
}

type ReintentableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** On an expired access token, refresh once and replay the original request (SPEC-03 Req. 5). */
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as ReintentableConfig | undefined;
    if (!config || config._retry || isPublic(config.url) || !isInvalidToken(error)) {
      return Promise.reject(error);
    }
    try {
      const opened = await refreshOnce();
      useChatStore.getState().applySession(opened.accessToken, opened.expiresIn);
    } catch {
      useChatStore.getState().logout();
      return Promise.reject(error);
    }
    config._retry = true;
    config.headers.Authorization = `Bearer ${useChatStore.getState().accessToken}`;
    return http(config);
  }
);

async function conFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export const chatbotApi: ChatbotApiPort = {
  async login(email, password) {
    const { data } = await http.post("/sesion/login", { email, password });
    if (data?.mfaRequerido) return data as MfaChallenge;
    return data as SessionOpened;
  },
  async requestMfaCode(canal) {
    const { data } = await http.post("/sesion/mfa/solicitar", { canal });
    return data as { ok: true };
  },
  async verifyMfaCode(code) {
    const { data } = await http.post("/sesion/mfa/verificar", { code });
    return data as SessionOpened;
  },
  async refreshSession() {
    return refreshOnce();
  },
  async logout() {
    try {
      const { data } = await http.post("/sesion/logout");
      return data as { ok: true };
    } finally {
      useChatStore.getState().logout();
    }
  },
  async fetchProfile() {
    const { data } = await http.get("/sesion/perfil");
    return data as PerfilCliente;
  },
  async enviarMensaje(conversacionId, texto) {
    return conFallback(
      async () => {
        const { data } = await http.post(
          `/chat/conversaciones/${conversacionId}/mensajes`,
          { texto }
        );
        return { mensajeId: data.mensajeId as string };
      },
      { mensajeId: `mock-${Date.now()}` }
    );
  },
  async cargarHistorial(conversacionId, desde) {
    const base: Mensaje[] =
      MOCK_MENSAJES[conversacionId] ?? MOCK_MENSAJES["talla-42"] ?? [];
    if (!desde) return conFallback(async () => {
      const { data } = await http.get(
        `/chat/conversaciones/${conversacionId}/mensajes`
      );
      return data as Mensaje[];
    }, base);
    return base.filter((m) => m.id > desde);
  },
  // Barra lateral (SPEC-05 Req. 1): sin fallback a mocks; el error llega a la UI.
  async crearConversacion() {
    const { data } = await http.post(`/chat/conversaciones`);
    return { conversacionId: data.conversacionId as string };
  },
  async listarConversaciones(pagina = 1): Promise<ConversacionResumen[]> {
    const { data } = await http.get(`/chat/conversaciones`, { params: { pagina } });
    return data as ConversacionResumen[];
  },
  async buscarConversaciones(q, pagina = 1): Promise<ConversacionResumen[]> {
    const { data } = await http.get(`/chat/conversaciones/buscar`, {
      params: { q, pagina },
    });
    return data as ConversacionResumen[];
  },
  async agregarAlCarrito(input) {
    return conFallback(async () => {
      await http.post(`/carrito/lineas`, input, {
        timeout: apiConfig.timeouts.catalogo,
      });
      return { ok: true as const };
    }, { ok: true as const });
  },
  async validarContactoCelular(codigo) {
    return conFallback(async () => {
      const { data } = await http.post(`/contacto/celular/verificar`, {
        codigo,
      });
      return data as { verificado: boolean };
    }, { verificado: /^\d{6}$/.test(codigo) });
  },
  async cotizar() {
    return conFallback(async () => {
      const { data } = await http.get(`/checkout/cotizacion`);
      return data as { total: number };
    }, { total: 0 });
  },
  async crearCheckout(input) {
    return conFallback(async () => {
      const { data } = await http.post(`/checkout`, input, {
        timeout: apiConfig.timeouts.pago,
      });
      return data as { pedidoId: string };
    }, { pedidoId: "#A-1043" });
  },
  async reenviarConfirmacion(pedidoId) {
    return conFallback(async () => {
      await http.post(`/pedidos/${encodeURIComponent(pedidoId)}/reenviar`);
      return { ok: true as const };
    }, { ok: true as const });
  },
  suscribirBloques() {
    return () => {};
  },
};
