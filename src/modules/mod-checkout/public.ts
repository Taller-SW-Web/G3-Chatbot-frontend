/**
 * Superficie pública de mod-checkout.
 * Otros módulos solo pueden importar desde aquí; nunca su domain/application/adapters.
 */
export { CheckoutPage } from "./ui/CheckoutPage";
export { OrderSuccessPage } from "./ui/OrderSuccessPage";
export { ResumenCheckout } from "./ui/blocks/ResumenCheckout";
export { RatingPopup } from "./ui/RatingPopup";

export type {
  CheckoutPort,
  CheckoutSesionData,
  CrearCheckoutInput,
  ProcesarPagoInput,
  ResultadoPago,
} from "./ports/checkoutPort";
