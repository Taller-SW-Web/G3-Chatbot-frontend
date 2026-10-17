const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Un id de conversación solo ubica el carrito anónimo si es un UUID real. */
export function conversacionParaCarrito(
  conversacionId?: string | null
): string | undefined {
  if (!conversacionId) return undefined;
  return UUID.test(conversacionId) ? conversacionId : undefined;
}
