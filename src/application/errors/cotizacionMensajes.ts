import { isUnavailable, problemCode } from "@/domain/utils/httpError";

/** Mensaje humano del fallo de cotización (SPEC-12): sin cobertura, sesión o módulo. */
export function mensajeCotizacion(error: unknown): string {
  const code = problemCode(error);
  if (code === "SIN_COBERTURA") {
    return "Aún no llegamos a ese distrito. Prueba con otro.";
  }
  if (code === "PRODUCTO_NO_DISPONIBLE") {
    return "Un producto de tu carrito ya no está disponible para el envío.";
  }
  if (code === "REQUIERE_SESION" || code === "TOKEN_INVALIDO") {
    return "Inicia sesión para calcular el envío.";
  }
  if (code === "DEMASIADAS_SOLICITUDES") {
    return "Hicimos muchas cotizaciones seguidas. Espera un momento y reintenta.";
  }
  if (isUnavailable(error)) {
    return "No pudimos calcular el envío ahora. Revisa tu conexión e intenta de nuevo.";
  }
  return "No pudimos calcular el envío.";
}
