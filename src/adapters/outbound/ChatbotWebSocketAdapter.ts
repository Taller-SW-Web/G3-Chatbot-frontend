"use client";

import type { WebSocketPort, WsEvento } from "@/ports/outbound/WebSocketPort";
import { apiConfig } from "@/infrastructure/config/apiConfig";
import { useChatStore } from "@/application/state/chatStore";

/**
 * WS con handshake JWT, reconexión y 2 reintentos.
 * Si falla o no hay backend, el hook hace polling 2s vía cargarHistorial.
 */
class WsAdapter implements WebSocketPort {
  private ws: WebSocket | null = null;
  private intentos = 0;

  conectar(conversacionId: string, onEvento: (e: WsEvento) => void) {
    const token = useChatStore.getState().accessToken;
    const base = apiConfig.baseUrl
      .replace(/^http/, "ws")
      .replace(/\/api$/, "");
    const url = `${base}/ws/chat/${conversacionId}${token ? `?token=${encodeURIComponent(token)}` : ""}`;

    try {
      this.ws = new WebSocket(url);
    } catch {
      return; // deja que el polling tome el relevo
    }

    this.ws.onmessage = (ev) => {
      try {
        onEvento(JSON.parse(ev.data) as WsEvento);
      } catch {
        /* ignora frames no JSON */
      }
    };
    this.ws.onclose = () => {
      if (this.intentos < apiConfig.wsReintentos) {
        this.intentos += 1;
        setTimeout(() => this.conectar(conversacionId, onEvento), 1000);
      }
    };
    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  desconectar() {
    this.ws?.close();
    this.ws = null;
    this.intentos = 0;
  }
}

export const chatbotWs = new WsAdapter();
