"use client";

import { authApi } from "@/modules/mod-auth/adapters/authApi";
import { catalogoApi } from "@/modules/mod-catalog/adapters/catalogoApi";
import { carritoApi } from "@/modules/mod-cart/adapters/carritoApi";
import { envioApi } from "@/modules/mod-shipping/adapters/envioApi";
import { checkoutApi } from "@/modules/mod-checkout/adapters/checkoutApi";
import { pedidosApi } from "@/modules/mod-orders/adapters/pedidosApi";
import { postventaApi } from "@/modules/mod-postventa/adapters/postventaApi";
import { chatApi } from "@/modules/mod-chat/adapters/chatApi";
import { chatbotSse } from "@/modules/mod-chat/adapters/chatStream";

/**
 * Composition root del frontend (ADR-0024).
 *
 * Es el único archivo de `shared/` que conoce los adapters de todos los
 * módulos: cablea las implementaciones y expone el agregado `api` que ya
 * consumían las pantallas, más cada API por módulo. Ningún módulo importa
 * adapters de otro módulo.
 */
const api = {
  ...authApi,
  ...catalogoApi,
  ...carritoApi,
  ...envioApi,
  ...checkoutApi,
  ...pedidosApi,
  ...postventaApi,
  ...chatApi,
};

export type ContainerApi = typeof api;

export const container = {
  api,
  auth: authApi,
  catalogo: catalogoApi,
  carrito: carritoApi,
  envio: envioApi,
  checkout: checkoutApi,
  pedidos: pedidosApi,
  postventa: postventaApi,
  chat: chatApi,
  stream: chatbotSse,
};
