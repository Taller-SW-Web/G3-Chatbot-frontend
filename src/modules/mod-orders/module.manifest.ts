import type { ModuleManifest } from "@/shared/config/moduleManifest";

export const manifest = {
  id: "mod-orders",
  name: "Pedidos y seguimiento",
  owner: "@MathiasTL",
  routes: [
    { path: "/pedidos", description: "Historial de pedidos por estado" },
    { path: "/pedidos/[tab]", description: "Historial filtrado por pestaña" },
    { path: "/seguimiento", description: "Hitos del despacho de un pedido" },
  ],
  nav: [
    { href: "/pedidos", label: "Historial de pedidos" },
    { href: "/seguimiento", label: "Seguimiento" },
  ],
  endpoints: [
    "/pedidos",
    "/pedidos/{pedidoId}",
    "/pedidos/{pedidoId}/seguimiento",
    "/pedidos/{pedidoId}/csat",
    "/pedidos/{pedidoId}/reenviar-confirmacion",
  ],
  dependsOn: ["mod-checkout"],
} satisfies ModuleManifest;
