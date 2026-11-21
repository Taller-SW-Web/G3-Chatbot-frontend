/** Contrato REST de checkout y pago (SPEC-12, SPEC-14). */

/** Body of `POST /checkout`: the server computes lines and amounts (contratos-integracion §2.8). */
export type CrearCheckoutInput = {
  cartId?: string;
  direccion?: Record<string, unknown>;
  contacto?: Record<string, unknown>;
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
};

export interface CheckoutPort {
  /** SPEC-14: Inicia sesión de checkout en backend con vigencia de 15 min. */
  iniciarCheckout(input: CrearCheckoutInput, idempotencyKey?: string): Promise<CheckoutSesionData>;
  /** SPEC-14: Consulta estado del checkout e intentos restantes. */
  obtenerCheckout(checkoutId: string): Promise<CheckoutSesionData>;
  /** SPEC-14: Simula el pago con tarjeta determinista contra el simulador de backend. */
  pagarCheckout(checkoutId: string, input: ProcesarPagoInput, idempotencyKey?: string): Promise<ResultadoPago>;
}
