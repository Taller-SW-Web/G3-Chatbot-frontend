"use client";

import { chatbotApi } from "@/adapters/outbound/ChatbotApiAxiosAdapter";
import { chatbotWs } from "@/adapters/outbound/ChatbotWebSocketAdapter";
import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";
import type { WebSocketPort } from "@/ports/outbound/WebSocketPort";

/** DI + wiring adapters (ADR-0002). La UI solo importa este container. */
export const container = {
  api: chatbotApi as ChatbotApiPort,
  ws: chatbotWs as WebSocketPort,
};
