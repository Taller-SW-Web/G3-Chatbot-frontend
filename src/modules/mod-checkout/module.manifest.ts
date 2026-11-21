import type { ModuleManifest } from "@/shared/config/moduleManifest";

export const manifest = {
  id: "mod-checkout",
  name: "Checkout y pago",
  owner: "@MathiasTL",
  routes: [
    { path: "/checkout", description: "Dirección, cotización, tarjeta y pago simulado" },
    { path: "/exito", description: "Confirmación del pedido y calificación" },
  ],
  nav: [],
  endpoints: [
    "/checkout",
    "/checkout/{checkoutId}",
    "/checkout/{checkoutId}/pago",
  ],
  dependsOn: ["mod-cart", "mod-shipping"],
} satisfies ModuleManifest;
