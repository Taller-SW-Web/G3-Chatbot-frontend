import type { ModuleManifest } from "@/shared/config/moduleManifest";

export const manifest = {
  id: "mod-shipping",
  name: "Envío",
  owner: "@Taller-SW-Web/chatbot",
  routes: [],
  nav: [],
  endpoints: ["/envio/cotizar"],
  dependsOn: ["mod-cart"],
} satisfies ModuleManifest;
