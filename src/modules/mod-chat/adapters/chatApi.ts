"use client";

import { http } from "@/shared/api/http";
import { apiConfig } from "@/shared/config/apiConfig";
import type { Bloque } from "@/modules/mod-chat/domain/entities/Bloque";
import type {
  ChatApiPort,
  ConversacionResumen,
} from "@/modules/mod-chat/ports/chatApiPort";
import { mapearHistorial } from "@/modules/mod-chat/adapters/mapearHistorial";

/** Adapter REST del chat: conversaciones, historial y acciones (SPEC-05). */
export const chatApi: ChatApiPort = {
  async cargarHistorial(conversacionId) {
    const { data } = await http.get(
      `/chat/conversaciones/${encodeURIComponent(conversacionId)}/mensajes`
    );
    return mapearHistorial(data);
  },
  async ejecutarAccion(conversacionId, accion) {
    // Add also aggregates stock, pricing, evaluation and optional cross-sell.
    const agregaComercio = ["VER_OFERTAS", "RECOMENDAR_PRODUCTOS", "BUSCAR_PRODUCTOS", "BUSCAR_POR_CATEGORIA", "BUSCAR_PAGINA", "AGREGAR_AL_CARRITO"].includes(accion.tipo);
    const { data } = await http.post(
      `/chat/conversaciones/${encodeURIComponent(conversacionId)}/mensajes`,
      { accion },
      { timeout: agregaComercio ? apiConfig.timeouts.listadoCatalogo : apiConfig.timeouts.defecto }
    );
    return {
      texto: data.texto as string,
      bloques: data.bloques as Bloque[],
    };
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
};
