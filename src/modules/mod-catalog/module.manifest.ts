import type { ModuleManifest } from "@/shared/config/moduleManifest";

export const manifest = {
  id: "mod-catalog",
  name: "Catálogo",
  owner: "@SOoOnny",
  routes: [{ path: "/", description: "Home con ofertas, tarjetas y detalle de producto" }],
  nav: [{ href: "/", label: "Inicio" }],
  endpoints: [
    "/catalogo/productos",
    "/catalogo/productos/{productId}",
    "/catalogo/disponibilidad",
  ],
  dependsOn: [],
} satisfies ModuleManifest;
