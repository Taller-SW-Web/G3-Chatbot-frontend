"use client";

import axios from "axios";
import { apiConfig } from "@/infrastructure/config/apiConfig";
import { useChatStore } from "@/application/state/chatStore";
import type {
  ChatbotApiPort,
  ConversacionResumen,
} from "@/ports/outbound/ChatbotApiPort";
import { mapearHistorial } from "./mapearHistorial";

/**
 * Adapter REST con interceptor JWT.
 * Conversaciones e historial van al backend real y propagan el error; los demás
 * métodos (carrito, cotización, checkout, contacto) caen a valores del wireframe
 * si no hay backend, para que el equipo no se bloquee.
 * Ramifica por `code` problem+json.
 */
const http = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: apiConfig.timeouts.defecto,
});

http.interceptors.request.use((cfg) => {
  const token = useChatStore.getState().accessToken;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

async function conFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export const chatbotApi: ChatbotApiPort = {
  // Conversaciones e historial (SPEC-05): sin fallback a mocks; el error llega a la UI.
  async cargarHistorial(conversacionId) {
    const { data } = await http.get(
      `/chat/conversaciones/${encodeURIComponent(conversacionId)}/mensajes`
    );
    return mapearHistorial(data);
  },
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
};
