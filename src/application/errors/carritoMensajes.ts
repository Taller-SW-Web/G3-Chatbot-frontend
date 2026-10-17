/** Mensajes accionables por `code` problem+json del carrito (SPEC-10, SPEC-11). */
export function mensajeCarrito(code: string | null | undefined): string {
  switch (code) {
    case "STOCK_INSUFICIENTE":
      return "No hay stock suficiente para esa cantidad. Prueba con menos.";
    case "SKU_AGOTADO":
      return "Ese producto se agotó. Quítalo para continuar.";
    case "SERVICIO_NO_DISPONIBLE":
    case "INDETERMINADO":
      return "No puedo confirmar el stock ahora; intenta en unos segundos.";
    case "LIMITE_CANTIDAD":
      return "El máximo por producto es 10 unidades.";
    case "LINEA_AMBIGUA":
      return "¿Cuáles? Elige la línea exacta.";
    case "LINEA_NO_ENCONTRADA":
      return "Esa línea ya no está en tu carrito.";
    case "CONFLICTO":
    case "CARRITO_DESACTUALIZADO":
      return "Tu carrito cambió mientras elegías. Revisa las líneas marcadas.";
    case "VARIANTE_REQUERIDA":
      return "Elige talla y color antes de agregar.";
    case "REQUIERE_SESION":
      return "Inicia sesión o abre un chat para ver tu carrito.";
    case "RECURSO_NO_ENCONTRADO":
      return "No encontramos esa conversación. Abre un chat para ver tu carrito.";
    case "PRODUCTO_NO_DISPONIBLE":
      return "Ese producto ya no está disponible.";
    case "VALIDACION":
      return "Revisa los datos e intenta de nuevo.";
    default:
      return "No pudimos completar la acción. Intenta de nuevo.";
  }
}
