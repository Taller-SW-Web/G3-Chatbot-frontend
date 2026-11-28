/** Contrato REST de checkout y pago (SPEC-12, SPEC-14). */
import type { TipoDocumento } from "@/shared/auth/Cliente";

/** Body of `POST /checkout`: the server computes lines and amounts (contratos-integracion §2.8). */
export type CrearCheckoutInput = {
  cartId?: string;
  direccion?: Record<string, unknown>;
  contacto?: Record<string, unknown>;
  /** SPEC-12: guarda la dirección en el perfil para próximas compras. */
  guardarDireccion?: boolean;
};

/** Línea que el backend reporta como desactualizada en un `409 CARRITO_DESACTUALIZADO`. */
export type LineaDesactualizada = {
  sku: string;
  nombre?: string;
  cantidad?: number;
  /** `AGOTADO`, `STOCK_INSUFICIENTE`, `PRECIO_CAMBIADO`, … */
  motivo?: string;
  disponible?: number | null;
  mensaje?: string;
};

export type CheckoutSesionData = {
  id: string;
  cartId: string;
  orderId?: string;
  status: string;
  total: number;
  expiresAt: string;
  intentosRestantes: number;
  summary: Record<string, unknown>;
  /** SPEC-12: aviso cuando Seguridad falla al guardar la dirección. */
  avisoDireccion?: string | null;
};

export type ProcesarPagoInput = {
  numeroTarjeta: string;
  titular: string;
  vencimiento: string;
  cvv: string;
};

export type ResultadoPago = {
  id: string;
  checkoutId: string;
  orderId?: string;
  resultado: string;
  marca: string;
  ultimos4: string;
  monto: number;
  idTransaccion?: string;
  correoEnmascarado?: string;
  mensaje?: string;
  /** Estado del pedido tras procesar el pago (SPEC-14, backend #269). */
  estado?: string;
  nuevoEstado?: string;
};

export interface CheckoutPort {
  /** SPEC-14: Inicia sesión de checkout en backend con vigencia de 15 min. */
  iniciarCheckout(input: CrearCheckoutInput, idempotencyKey?: string): Promise<CheckoutSesionData>;
  /** SPEC-14: Consulta estado del checkout e intentos restantes. */
  obtenerCheckout(checkoutId: string): Promise<CheckoutSesionData>;
  /** SPEC-14: Simula el pago con tarjeta determinista contra el simulador de backend. */
  pagarCheckout(checkoutId: string, input: ProcesarPagoInput, idempotencyKey?: string): Promise<ResultadoPago>;
  /** SPEC-24 Req. 7: valora la experiencia de compra (una por pedido, propia del chatbot). */
  calificarCompra(pedidoId: string, estrellas: 1 | 2 | 3 | 4 | 5, comentario?: string): Promise<void>;
}
