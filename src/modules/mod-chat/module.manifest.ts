import type { ModuleManifest } from "@/shared/config/moduleManifest";

export const manifest = {
  id: "mod-chat",
  name: "Chat",
  owner: "@Ankarmin",
  routes: [
    { path: "/chat/[id]", description: "Conversación con historial y bloques en línea" },
    { path: "/sugerencias", description: "Formulario de sugerencias del asistente" },
  ],
  nav: [{ href: "/sugerencias", label: "Sugerencias" }],
  endpoints: [
    "/chat/conversaciones",
    "/chat/conversaciones/buscar",
    "/chat/conversaciones/{conversacionId}/mensajes",
    "/chat/conversaciones/{conversacionId}/adjuntos",
    "/chat/conversaciones/{conversacionId}/adjuntos/{adjuntoId}",
    "/chat/adjuntos/{adjuntoId}",
  ],
  dependsOn: [
    "mod-auth",
    "mod-catalog",
    "mod-cart",
    "mod-shipping",
    "mod-checkout",
    "mod-orders",
    "mod-postventa",
  ],
} satisfies ModuleManifest;
