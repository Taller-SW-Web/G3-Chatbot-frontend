"use client";

import { http } from "@/shared/api/http";
import { apiConfig } from "@/shared/config/apiConfig";
import type { Bloque } from "@/modules/mod-chat/domain/entities/Bloque";
import type { AdjuntoMensaje } from "@/modules/mod-chat/domain/entities/Adjunto";
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
  async subirAdjunto(conversacionId, archivo, onProgress) {
    const form = new FormData();
    form.append("archivo", archivo);
    const { data } = await http.post(
      `/chat/conversaciones/${encodeURIComponent(conversacionId)}/adjuntos`,
      form,
      {
        timeout: apiConfig.timeouts.catalogo,
        onUploadProgress: (evento) => {
          if (!onProgress || !evento.total) return;
          onProgress(Math.round((evento.loaded * 100) / evento.total));
        },
      }
    );
    return mapearAdjunto(data);
  },
  async eliminarAdjunto(conversacionId, adjuntoId) {
    await http.delete(
      `/chat/conversaciones/${encodeURIComponent(conversacionId)}/adjuntos/${encodeURIComponent(adjuntoId)}`
    );
  },
  async obtenerUrlAdjunto(adjuntoId) {
    const { data } = await http.get(`/chat/adjuntos/${encodeURIComponent(adjuntoId)}`);
    return data as { urlMiniatura?: string | null; urlImagen?: string | null; expiraEn?: string | null };
  },
};

/** Normaliza la respuesta del backend sin acoplar la UI a snake_case. */
function mapearAdjunto(data: unknown): AdjuntoMensaje {
  const item = (data ?? {}) as Record<string, unknown>;
  const numero = (valor: unknown) => (typeof valor === "number" ? valor : null);
  const texto = (valor: unknown) => (typeof valor === "string" ? valor : null);
  return {
    adjuntoId: String(item.adjuntoId ?? item.id ?? ""),
    mimeType: String(item.mimeType ?? item.mime_type ?? "image/jpeg"),
    ancho: numero(item.ancho ?? item.width),
    alto: numero(item.alto ?? item.height),
    tamanioBytes: numero(item.tamanioBytes ?? item.size_bytes) ?? undefined,
    urlMiniatura: texto(item.urlMiniatura ?? item.url_miniatura),
    urlImagen: texto(item.urlImagen ?? item.url_imagen),
    expiraEn: texto(item.expiraEn ?? item.expira_en),
  };
}
