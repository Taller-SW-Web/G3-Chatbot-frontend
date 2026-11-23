import type { ModuleManifest } from "@/shared/config/moduleManifest";

export const manifest = {
  id: "mod-auth",
  name: "Autenticación y cuenta",
  owner: "@Taller-SW-Web/chatbot",
  routes: [
    { path: "/cuenta", description: "Datos de la cuenta y verificación del celular" },
    { path: "/verificar-correo", description: "Canje del enlace de verificación de correo" },
  ],
  nav: [{ href: "/cuenta", label: "Mi cuenta" }],
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
  dependsOn: [],
} satisfies ModuleManifest;
