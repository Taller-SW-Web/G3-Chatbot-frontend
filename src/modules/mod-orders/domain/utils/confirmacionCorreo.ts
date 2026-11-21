/** Texto del correo de confirmación en el chat (SPEC-16 Req. 3).
 *
 * Usa el `correoEnmascarado` del backend y oculta además el dominio
 * ("m***a@…"). Si por error llegara un correo sin máscara, se enmascara aquí:
 * la UI nunca muestra el correo completo. Sin React, sin fetch (regla hexagonal domain/).
 */

function parteLocalEnmascarada(correo: string): string {
  const local = correo.trim().split("@")[0] ?? "";
  if (!local) return "***";
  if (local.includes("*")) return local;
  if (local.length <= 2) return "*".repeat(local.length);
  return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}`;
}

/** "m***a@…": parte local enmascarada y dominio oculto. */
export function correoParaChat(correoEnmascarado: string): string {
  return `${parteLocalEnmascarada(correoEnmascarado)}@…`;
}

/** Aviso tras la compra: no promete que el correo ya llegó. */
export function avisoConfirmacion(correoEnmascarado: string): string {
  return `Te enviaremos la confirmación a ${correoParaChat(correoEnmascarado)}`;
}

/** "Te queda 1 reenvío" / "Te quedan 2 reenvíos" / "Ya no quedan reenvíos". */
export function textoReenviosRestantes(restantes: number): string {
  if (restantes <= 0) return "Ya no quedan reenvíos para este pedido.";
  return restantes === 1 ? "Te queda 1 reenvío." : `Te quedan ${restantes} reenvíos.`;
}
