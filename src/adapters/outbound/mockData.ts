"use client";

import type { Mensaje } from "@/domain/entities/Mensaje";
import type { ConversacionResumen } from "@/ports/outbound/ChatbotApiPort";

/** Mocks fieles al wireframe para trabajar sin backend. */
export const MOCK_CONVERSACIONES: ConversacionResumen[] = [
  { id: "talla-42", titulo: "Zapatillas talla 42", preview: "Talla 42, color negro", fecha: "Ayer", ultimoMensajeEn: "2026-09-28" },
  { id: "ofertas-running", titulo: "Ofertas running", preview: "¿Qué ofertas hay en running?", fecha: "23 sept", ultimoMensajeEn: "2026-09-23" },
  { id: "estado-pedido", titulo: "Estado pedido #A-1042", preview: "¿Dónde está mi pedido?", fecha: "22 sept", ultimoMensajeEn: "2026-09-22" },
  { id: "cambio-talla", titulo: "Cambio por talla", preview: "Me quedó chica la talla 41", fecha: "21 sept", ultimoMensajeEn: "2026-09-21" },
  { id: "seguimiento-reclamo", titulo: "Seguimiento de reclamo", preview: "¿En qué estado está mi reclamo?", fecha: "18 sept", ultimoMensajeEn: "2026-09-18" },
  { id: "reclamo-defecto", titulo: "Reclamo por defecto", preview: "Me llegó una zapatilla defectuosa", fecha: "20 sept", ultimoMensajeEn: "2026-09-20" },
  { id: "devolucion-compra", titulo: "Devolución de compra", preview: "Quiero devolver unas zapatillas", fecha: "19 sept", ultimoMensajeEn: "2026-09-19" },
];

export const MOCK_MENSAJES: Record<string, Mensaje[]> = {
  // Sin backend no hay historial: el ChatPage usa MOCK_SEEDS (fiel al wireframe).
  // Cuando el backend responda, el adapter devolverá los mensajes reales.
};

/** Botón bajo el mensaje del bot. Requiere sesión (sin historial no hay a dónde ir). */
export type AccionSeed = { etiqueta: string; href: string };

export type SeedMsg =
  | { from: "user"; text: string }
  | { from: "bot"; text: string; accion?: AccionSeed }
  | { from: "bot-cards" }
  | { from: "bot-login" };

const SEGUIMIENTO = { etiqueta: "Ver seguimiento del pedido", href: "/seguimiento" };
const FORM_RECLAMO = { etiqueta: "Ir al formulario de reclamo", href: "/reclamo" };
const FORM_DEVOLUCION = { etiqueta: "Ir al formulario de devolución", href: "/devolucion" };
const VER_RECLAMO = { etiqueta: "Ver mi reclamo", href: "/pedidos/reclamos" };
const VER_DEVOLUCION = { etiqueta: "Ver mi devolución", href: "/pedidos/reembolso" };

/** Semillas wireframe por conversación / flujo. Paridad con Mockups-Wireframes. */
export const MOCK_SEEDS: Record<string, SeedMsg[]> = {
  "talla-42": [
    { from: "user", text: "Quiero zapatillas" },
    { from: "bot", text: "Hola, soy Botleta, tu asistente virtual de la tienda. ¿Qué talla buscas?" },
    { from: "user", text: "Talla 42, color negro" },
    { from: "bot", text: "Perfecto. Verifiqué stock en Talla 42 · Negro. Estas son mis recomendaciones para ti:" },
    { from: "bot-cards" },
  ],
  "ofertas-q": [
    { from: "user", text: "Quiero ver las ofertas" },
    { from: "bot", text: "Hola, soy Botleta, tu asistente virtual de la tienda. Estas son las promociones vigentes: Running -20% hasta 30 sep, Urbano 2x1 hasta 28 sep." },
    { from: "bot-cards" },
  ],
  "ofertas-running": [
    { from: "user", text: "¿Qué ofertas hay en running?" },
    { from: "bot", text: "Estas son las ofertas vigentes con precio y vigencia confirmados:" },
    { from: "bot-cards" },
    { from: "bot", text: "¿Agrego alguna al carrito o quieres ver el detalle de un modelo?" },
  ],
  "estado-pedido": [
    { from: "user", text: "¿Dónde está mi pedido #A-1042?" },
    { from: "bot", text: "Tu pedido #A-1042 está EN CAMINO." },
    { from: "bot", text: "Entrega estimada: 18 sep 2026 · Av. Siempre Viva 742, Lima. Puedes ver el detalle en Historial de pedidos → En proceso.", accion: SEGUIMIENTO },
  ],
  "rastrear-q": [
    { from: "user", text: "Quiero rastrear mi pedido" },
    { from: "bot", text: "¿Qué pedido quieres rastrear? Dime el número (ej. #A-1042) o descríbelo (ej. 'las zapatillas blancas')." },
  ],
  "rastrear-continue": [
    { from: "user", text: "Quiero rastrear mi pedido" },
    { from: "bot", text: "¡Listo, ya iniciaste sesión! ¿Qué pedido quieres rastrear? Dime el número o descríbelo." },
  ],
  "devolucion-q": [
    { from: "user", text: "Necesito ayuda con una devolución" },
    { from: "bot", text: "¿Es devolución del dinero o cambio de talla? ¿De qué pedido o producto se trata?" },
  ],
  "devolucion-continue": [
    { from: "user", text: "Necesito ayuda con una devolución" },
    { from: "bot", text: "¡Listo, ya iniciaste sesión! ¿Es devolución del dinero o cambio de talla? ¿De qué pedido se trata?" },
  ],
  "rastrear-ok": [
    { from: "user", text: "Quiero rastrear mi pedido" },
    { from: "bot", text: "¿Qué pedido quieres rastrear? Dime el número (ej. #A-1042) o descríbelo (ej. 'las zapatillas blancas')." },
    { from: "user", text: "Un pedido de zapatillas blancas" },
    { from: "bot", text: 'Con tu descripción ("Un pedido de zapatillas blancas") encontré tu pedido #A-1042: Zapatilla Runner blanca, talla 41.' },
    { from: "bot", text: "Estado: EN CAMINO · Entrega estimada 18 sep 2026 · Av. Siempre Viva 742, Lima. Más detalle en Historial de pedidos → En proceso.", accion: SEGUIMIENTO },
  ],
  "cambio-talla": [
    { from: "user", text: "Quiero cambiar unas zapatillas, me quedó mal la talla" },
    { from: "bot", text: "Claro. ¿Es del pedido #A-0987 entregado el 2 sep?" },
    { from: "user", text: "Sí, la talla 41 me quedó chica, necesito 42" },
    { from: "bot", text: "Te preparé la solicitud de CAMBIO a talla 42. Plazo: 7 días naturales desde la entrega. Envíame una foto de la evidencia (≤ 5 MB) por aquí.", accion: { etiqueta: "Ir al formulario de cambio", href: "/devolucion" } },
    { from: "user", text: "📷 Foto enviada: zapatilla-talla41.jpg" },
    { from: "bot", text: "¡Foto recibida y válida! Solicitud de cambio registrada con código DEV-2026-00045. Te avisaré por correo y podrás seguirla en Historial de pedidos → Reembolso/Cambio. El recojo se coordina al mismo domicilio de entrega.", accion: { etiqueta: "Ver mi cambio", href: "/pedidos/reembolso" } },
  ],
  "seguimiento-reclamo": [
    { from: "user", text: "¿En qué estado está mi reclamo?" },
    { from: "bot", text: "Tu reclamo #REC-2026-0118 sigue EN PROCESO. Te avisaremos por correo cuando tenga respuesta.", accion: VER_RECLAMO },
    { from: "user", text: "¿Y mi devolución?" },
    { from: "bot", text: "Tu devolución DEV-2026-00045 fue APROBADA. El reembolso está en camino y lo verás en Historial de pedidos → Reembolso/Cambio.", accion: VER_DEVOLUCION },
  ],
  "reclamo-defecto": [
    { from: "user", text: "Quiero hacer un reclamo, me llegó una zapatilla defectuosa" },
    { from: "bot", text: "Lamento eso. ¿Es del pedido PED-2026-00891?" },
    { from: "user", text: "Sí, la suela viene despegada" },
    { from: "bot", text: "Te preparé el formulario de reclamo con esos datos. Revísalo y pulsa Enviar reclamo para registrarlo. Plazo: 15 días hábiles.", accion: FORM_RECLAMO },
  ],
  "devolucion-compra": [
    { from: "user", text: "Quiero devolver unas zapatillas" },
    { from: "bot", text: "¿Devolución del dinero o cambio por otra talla?" },
    { from: "user", text: "Devolución del dinero, no me quedaron" },
    { from: "bot", text: "Te preparé el formulario de devolución. Sube la evidencia (JPG/PNG/WEBP/PDF ≤ 5 MB) desde el formulario y pulsa Enviar solicitud.", accion: FORM_DEVOLUCION },
    { from: "user", text: "📷 Foto enviada: zapatilla-devolucion.jpg" },
    { from: "bot", text: "Recibí tu foto en el chat, pero las imágenes del chat no se reutilizan como evidencia. Complétala en el formulario y pulsa Enviar solicitud.", accion: FORM_DEVOLUCION },
  ],
  "devolucion-foto": [
    { from: "user", text: "Necesito ayuda con una devolución" },
    { from: "bot", text: "¿Es devolución del dinero o cambio de talla? ¿De qué pedido o producto se trata?" },
    { from: "user", text: "Es cambio, las blancas me quedaron chicas" },
    { from: "bot", text: "Te preparé el formulario de devolución con esos datos. Sube la evidencia (JPG/PNG/WEBP/PDF ≤ 5 MB) desde el formulario y pulsa Enviar solicitud para registrarlo.", accion: FORM_DEVOLUCION },
  ],
  "devolucion-ok": [
    { from: "user", text: "Necesito ayuda con una devolución" },
    { from: "bot", text: "¿Es devolución del dinero o cambio de talla? ¿De qué pedido o producto se trata?" },
    { from: "user", text: "Es cambio, las blancas me quedaron chicas" },
    { from: "bot", text: "Te preparé el formulario de devolución con esos datos. Sube la evidencia desde el formulario y pulsa Enviar solicitud para registrarlo.", accion: FORM_DEVOLUCION },
    { from: "user", text: "📷 Foto enviada: evidencia.jpg" },
    { from: "bot", text: "Recibí tu foto en el chat, pero las imágenes del chat no se reutilizan como evidencia. Complétala en el formulario de devolución y pulsa Enviar solicitud.", accion: FORM_DEVOLUCION },
  ],
  "reclamo-dup": [
    { from: "user", text: "Quiero hacer un reclamo por la Zapatilla Runner" },
    { from: "bot", text: "Aviso: ya tienes el reclamo REC-2026-0118 En revisión por ese pedido. Puedes ver su estado o registrar uno nuevo de todas formas.", accion: VER_RECLAMO },
    { from: "bot-cards" },
  ],
  "devolucion-dup": [
    { from: "user", text: "Quiero devolver la Zapatilla Runner" },
    { from: "bot", text: "Aviso: ya tienes la solicitud DEV-2026-0042 En revisión por ese pedido. Puedes ver su estado o registrar una nueva de todas formas.", accion: VER_DEVOLUCION },
    { from: "bot-cards" },
  ],
  "cambio-dup": [
    { from: "user", text: "Quiero un cambio de la Zapatilla Runner" },
    { from: "bot", text: "Aviso: ya tienes el cambio DEV-2026-0042 en curso por ese pedido. Puedes ver su estado o registrar uno nuevo de todas formas.", accion: { etiqueta: "Ver mi cambio", href: "/pedidos/reembolso" } },
    { from: "bot-cards" },
  ],
};

export const CHAT_INICIAL_SEED: SeedMsg[] = MOCK_SEEDS["talla-42"];

/** Cliente demo tras "Entrar como demo". La demo entra con correo ya verificado. */
export const DEMO_CLIENTE = {
  nombreCompleto: "Cliente Demo",
  correo: "cliente.demo@correo.com",
  correoEnmascarado: "c****@correo.com",
  celular: "+51 987 654 321",
  celularEnmascarado: "+51 9****4321",
  celularVerificado: false,
  tipoDocumento: "DNI" as const,
  documentoEnmascarado: "*****234",
};

export const PRODUCTOS_MOCK = [
  { sku: "A", nombre: "Producto A", categoria: "Calzado deportivo", talla: "Talla 42", color: "Negro", precio: 59, stock: 10 },
  { sku: "B", nombre: "Producto B", categoria: "Calzado deportivo", talla: "Talla 42", color: "Negro", precio: 72, stock: 8 },
  { sku: "C", nombre: "Producto C", categoria: "Calzado deportivo", talla: "Talla 42", color: "Negro", precio: 89, stock: 5 },
  { sku: "D", nombre: "Producto D", categoria: "Calzado deportivo", talla: "Talla 42", color: "Negro", precio: 110, stock: 3 },
];

export const CHAT_CARDS_MOCK = [
  { sku: "RUN-42-BLA", nombre: "Zapatilla Runner", precio: 59, talla: "Talla 42", color: "Blanco", categoria: "Calzado deportivo" },
  { sku: "URB-42-NEG", nombre: "Zapatilla Urban", precio: 72, talla: "Talla 42", color: "Negro", categoria: "Calzado deportivo" },
  { sku: "TRA-42-GRI", nombre: "Zapatilla Trail", precio: 130, talla: "Talla 42", color: "Gris", categoria: "Calzado outdoor" },
  { sku: "COU-42-BLA", nombre: "Zapatilla Court", precio: 95, talla: "Talla 42", color: "Blanco", categoria: "Calzado urbano" },
];

export const DISTRITOS = [
  "Lima Cercado", "Miraflores", "San Isidro", "Santiago de Surco",
  "La Molina", "San Miguel", "Los Olivos", "San Juan de Lurigancho",
  "Villa El Salvador", "Callao",
];
