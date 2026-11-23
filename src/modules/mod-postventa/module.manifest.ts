import type { ModuleManifest } from "@/shared/config/moduleManifest";

export const manifest = {
  id: "mod-postventa",
  name: "Postventa",
  owner: "@Taller-SW-Web/chatbot",
  routes: [
    { path: "/devolucion", description: "Solicitud de cambio o devolución con evidencias" },
    { path: "/reclamo", description: "Libro de Reclamaciones virtual" },
  ],
  nav: [
    { href: "/devolucion", label: "Devoluciones" },
    { href: "/reclamo", label: "Reclamos" },
  ],
  endpoints: [
    "/evidencias",
    "/devoluciones",
    "/devoluciones/{devolucionId}",
    "/reclamos",
    "/reclamos/{codigoSeguimiento}",
  ],
  dependsOn: ["mod-orders"],
} satisfies ModuleManifest;
