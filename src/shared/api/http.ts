"use client";

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { apiConfig } from "@/shared/config/apiConfig";
import { useChatStore } from "@/shared/auth/chatStore";
import { createSingleFlight } from "@/shared/api/singleFlight";

/**
 * Instancia axios compartida del canal (ADR-0024).
 * Único lugar del frontend con `axios.create`; los adapters de cada módulo
 * consumen esta instancia y sus interceptores.
 */
export const http = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: apiConfig.timeouts.defecto,
  withCredentials: true,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

/** Endpoints públicos: nunca llevan `Authorization` ni disparan refresh (SPEC-03 Req. 1/5). */
const PUBLIC_PATHS = [
  "/sesion/login",
  "/sesion/refresh",
  "/sesion/mfa/",
  "/sesion/logout",
  "/sesion/registro",
  "/sesion/verificar-correo",
  "/sesion/politica-contrasena",
];

function isPublic(path: string | undefined): boolean {
  return !!path && PUBLIC_PATHS.some((p) => path.includes(p));
}

function isPublicRequest(config: InternalAxiosRequestConfig): boolean {
  // Catalog reads use service credentials upstream, never the customer's session.
  // Propagate their failures without refreshing or clearing customer credentials.
  return isPublic(config.url) ||
    (config.method === "get" && !!config.url?.startsWith("/catalogo/"));
}

http.interceptors.request.use((cfg) => {
  const token = useChatStore.getState().accessToken;
  if (token && !isPublicRequest(cfg)) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

/** The BFF answers an expired, invalid or missing bearer with `401 TOKEN_INVALIDO` (SPEC-03 Req. 5). */
function isInvalidToken(error: unknown): boolean {
  const status = (error as AxiosError)?.response?.status;
  const code = (error as AxiosError<{ code?: string }>)?.response?.data?.code;
  return status === 401 && code === "TOKEN_INVALIDO";
}

async function doRefresh() {
  const { data } = await http.post("/sesion/refresh");
  return data as { accessToken: string; expiresIn: number };
}

/** Single-flight refresh: concurrent calls share one promise (SPEC-03 Req. 5). */
export const refreshSessionOnce = createSingleFlight(doRefresh);

type ReintentableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** On an expired access token, refresh once and replay the original request (SPEC-03 Req. 5). */
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as ReintentableConfig | undefined;
    if (!config || config._retry || isPublicRequest(config) || !isInvalidToken(error)) {
      return Promise.reject(error);
    }
    try {
      const opened = await refreshSessionOnce();
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
