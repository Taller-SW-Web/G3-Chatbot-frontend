import type { ModuleManifest } from "@/shared/config/moduleManifest";

export const manifest = {
  id: "mod-shipping",
  name: "Envío",
  owner: "@SOoOnny",
  routes: [],
  nav: [],
  endpoints: ["/envio/cotizar"],
  dependsOn: [],
} satisfies ModuleManifest;
