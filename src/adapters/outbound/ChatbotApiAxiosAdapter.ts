"use client";

import axios from "axios";
import { apiConfig } from "@/infrastructure/config/apiConfig";
import { useChatStore } from "@/application/state/chatStore";
import type {
  ChatbotApiPort,
  ConversacionResumen,
} from "@/ports/outbound/ChatbotApiPort";
import type { Mensaje } from "@/domain/entities/Mensaje";
import { MOCK_CONVERSACIONES, MOCK_MENSAJES } from "./mockData";

/**
 * Adapter REST con interceptor JWT.
 * Si no hay backend (baseUrl localhost sin respuesta), usa mocks del wireframe
 * para que el equipo frontend/backend pueda trabajar sin bloquearse.
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
  async listarConversaciones(): Promise<ConversacionResumen[]> {
    return conFallback(async () => {
      const { data } = await http.get(`/chat/conversaciones`);
      return data as ConversacionResumen[];
    }, MOCK_CONVERSACIONES);
  },
  async buscarConversaciones(q) {
    const all = await this.listarConversaciones();
    const low = q.toLowerCase();
    return all.filter(
      (c) =>
        c.titulo.toLowerCase().includes(low) ||
        c.preview.toLowerCase().includes(low)
    );
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
