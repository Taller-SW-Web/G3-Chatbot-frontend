"use client";

import { chatbotApi } from "@/adapters/outbound/ChatbotApiAxiosAdapter";
import { chatbotSse } from "@/adapters/outbound/ChatbotSseAdapter";
import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";
import type { ChatStreamPort } from "@/ports/outbound/ChatStreamPort";

/** DI + wiring adapters (ADR-0002). La UI solo importa este container. */
export const container = {
  api: chatbotApi as ChatbotApiPort,
  stream: chatbotSse as ChatStreamPort,
};
