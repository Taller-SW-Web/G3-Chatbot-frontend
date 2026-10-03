import type { Bloque } from "@/domain/entities/Bloque";
import type { Mensaje } from "@/domain/entities/Mensaje";

/**
 * Contrato REST hacia el backend (contratos §1, §2.8).
 * Único punto que los casos de uso conocen. Nunca Axios aquí.
 */
export type ProblemJson = {
  code: string;
  title: string;
  detail?: string;
  disponible?: number;
};

export type ConversacionResumen = {
  id: string;
  titulo: string;
  preview: string;
  fecha: string;
  ultimoMensajeEn: string;
};

export interface ChatbotApiPort {
  enviarMensaje(conversacionId: string, texto: string): Promise<{ mensajeId: string }>;
  cargarHistorial(conversacionId: string, desde?: string): Promise<Mensaje[]>;
  listarConversaciones(): Promise<ConversacionResumen[]>;
  buscarConversaciones(q: string): Promise<ConversacionResumen[]>;
  agregarAlCarrito(input: { sku: string; cantidad: number }): Promise<{ ok: true }>;
  validarContactoCelular(codigo: string): Promise<{ verificado: boolean }>;
  cotizar(): Promise<{ total: number }>;
  crearCheckout(input: {
    nombre: string;
    direccion: string;
    distrito: string;
    referencia?: string;
    docTipo: string;
    docNum: string;
    tarjetaLast4: string;
  }): Promise<{ pedidoId: string }>;
  reenviarConfirmacion(pedidoId: string): Promise<{ ok: true }>;
  // Resolución de streaming WS ya normalizada a bloques:
  suscribirBloques(onBloque: (b: Bloque) => void): () => void;
}
