import { problemCode, problemField } from "@/domain/utils/httpError";
import { mensajeCarrito } from "./carritoMensajes";

/** Motivos de rechazo que devuelve Productos en un `422 CUPON_INVALIDO`. */
const MOTIVOS: Record<string, string> = {
  INEXISTENTE: "Ese cupón no existe.",
  EXPIRADO: "El cupón venció.",
  NO_VIGENTE: "El cupón todavía no está vigente.",
  AGOTADO: "El cupón ya se agotó.",
  LIMITE_CLIENTE: "Ya usaste este cupón.",
  MONTO_MINIMO: "Tu carrito no llega al monto mínimo para este cupón.",
  NO_APLICA_PRODUCTOS: "El cupón no aplica a los productos de tu carrito.",
  NO_APLICA_CANAL: "El cupón no aplica a este canal.",
  NO_COMBINABLE: "El cupón no se puede combinar con otras ofertas.",
};

/** Mensaje accionable del cupón (SPEC-13), ramificando por `code` y `motivo`. */
export function mensajeCupon(error: unknown): string {
  const code = problemCode(error);
  if (code === "CUPON_INVALIDO") {
    const motivo = problemField(error, "motivo");
    return (motivo && MOTIVOS[motivo]) || "El cupón no es válido.";
  }
  if (code === "REQUIERE_CONFIRMACION_REEMPLAZO") {
    return "Ya tienes otro cupón aplicado.";
  }
  if (code === "DEMASIADAS_SOLICITUDES") {
    return "Hicimos muchos intentos. Espera unos minutos y vuelve a probar.";
  }
  if (code === "REQUIERE_SESION") {
    return "Inicia sesión para usar cupones.";
  }
  if (code === "SERVICIO_NO_DISPONIBLE" || code === "MODULO_NO_DISPONIBLE") {
    return "No pudimos validar el cupón ahora. Intenta en unos segundos.";
  }
  return mensajeCarrito(code);
}
