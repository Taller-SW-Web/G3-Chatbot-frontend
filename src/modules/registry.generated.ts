// AUTO-GENERADO por scripts/sync-modules.mjs — no editar a mano.
// Fuente: modules.manifest.json + src/modules/<id>/module.manifest.ts
import type { ModuleManifest } from "@/shared/config/moduleManifest";

export const moduleRegistry = [
  {
    id: "mod-auth",
    name: "Autenticación y cuenta",
    owner: "@Taller-SW-Web/chatbot",
    routes: [
      { path: "/cuenta", description: "Datos de la cuenta y verificación del celular" },
      { path: "/verificar-correo", description: "Canje del enlace de verificación de correo" },
    ],
    nav: [
      { href: "/cuenta", label: "Mi cuenta" },
    ],
    endpoints: [
      "/sesion/login",
      "/sesion/registro",
      "/sesion/politica-contrasena",
      "/sesion/verificar-correo",
      "/sesion/verificar-correo/reenviar",
      "/sesion/mfa/solicitar",
      "/sesion/mfa/verificar",
      "/sesion/refresh",
      "/sesion/logout",
      "/sesion/perfil",
      "/contacto/celular/solicitar-otp",
      "/contacto/celular/verificar-otp",
    ],
    dependsOn: [

    ],
  },
  {
    id: "mod-catalog",
    name: "Catálogo",
    owner: "@Taller-SW-Web/chatbot",
    routes: [
      { path: "/", description: "Home con ofertas, tarjetas y detalle de producto" },
    ],
    nav: [
      { href: "/", label: "Inicio" },
    ],
    endpoints: [
      "/catalogo/productos",
      "/catalogo/productos/{productId}",
      "/catalogo/disponibilidad",
    ],
    dependsOn: [

    ],
  },
  {
    id: "mod-cart",
    name: "Carrito",
    owner: "@Taller-SW-Web/chatbot",
    routes: [
      { path: "/carrito", description: "Líneas, cantidades, cupón y total del carrito" },
    ],
    nav: [
      { href: "/carrito", label: "Carrito" },
    ],
    endpoints: [
      "/carrito",
      "/carrito/items",
      "/carrito/items/{itemId}",
      "/carrito/cupon",
    ],
    dependsOn: [
      "mod-catalog",
    ],
  },
  {
    id: "mod-shipping",
    name: "Envío",
    owner: "@Taller-SW-Web/chatbot",
    routes: [

    ],
    nav: [

    ],
    endpoints: [
      "/envio/cotizar",
    ],
    dependsOn: [
      "mod-cart",
    ],
  },
  {
    id: "mod-checkout",
    name: "Checkout y pago",
    owner: "@Taller-SW-Web/chatbot",
    routes: [
      { path: "/checkout", description: "Dirección, cotización, tarjeta y pago simulado" },
      { path: "/exito", description: "Confirmación del pedido y calificación" },
    ],
    nav: [

    ],
    endpoints: [
      "/checkout",
      "/checkout/{checkoutId}",
      "/checkout/{checkoutId}/pago",
      "/pedidos/{pedidoId}/valoracion-compra",
    ],
    dependsOn: [
      "mod-cart",
      "mod-shipping",
    ],
  },
  {
    id: "mod-orders",
    name: "Pedidos y seguimiento",
    owner: "@Taller-SW-Web/chatbot",
    routes: [
      { path: "/pedidos", description: "Historial de pedidos por estado" },
      { path: "/pedidos/[tab]", description: "Historial filtrado por pestaña" },
      { path: "/pedido", description: "Detalle de un pedido y su historial" },
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
      "/pedidos/{pedidoId}/reenviar-confirmacion",
    ],
    dependsOn: [
      "mod-checkout",
    ],
  },
  {
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
      "/pedidos/{pedidoId}/csat",
    ],
    dependsOn: [
      "mod-orders",
    ],
  },
  {
    id: "mod-chat",
    name: "Chat",
    owner: "@Taller-SW-Web/chatbot",
    routes: [
      { path: "/chat/[id]", description: "Conversación con historial y bloques en línea" },
      { path: "/buscar", description: "Búsqueda de conversaciones por título y mensajes" },
      { path: "/sugerencias", description: "Formulario de sugerencias del asistente" },
    ],
    nav: [
      { href: "/sugerencias", label: "Sugerencias" },
    ],
    endpoints: [
      "/chat/conversaciones",
      "/chat/conversaciones/buscar",
      "/chat/conversaciones/{conversacionId}/mensajes",
      "/chat/conversaciones/{conversacionId}/adjuntos",
      "/chat/conversaciones/{conversacionId}/adjuntos/{adjuntoId}",
      "/chat/adjuntos/{adjuntoId}",
      "/mensajes/{mensajeId}/reaccion",
      "/sugerencias",
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
  },
] as const satisfies readonly ModuleManifest[];
