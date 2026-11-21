import type { ModuleManifest } from "@/shared/config/moduleManifest";

export const manifest = {
  id: "mod-cart",
  name: "Carrito",
  owner: "@SOoOnny",
  routes: [{ path: "/carrito", description: "Líneas, cantidades, cupón y total del carrito" }],
  nav: [{ href: "/carrito", label: "Carrito" }],
  endpoints: [
    "/carrito",
    "/carrito/items",
    "/carrito/items/{itemId}",
    "/carrito/cupon",
  ],
  dependsOn: ["mod-catalog"],
} satisfies ModuleManifest;
