/**
 * Marca efímera de "el usuario cerró sesión a propósito".
 *
 * Al revocar la cookie de refresh en el backend, el AuthGuard de la pantalla actual (p. ej. /cuenta)
 * ve fallar su renovación silenciosa antes de que termine la navegación a "/" y abriría el modal
 * de acceso como si la sesión hubiera vencido. El guard consulta esta marca para distinguir ambos casos.
 * Es solo en memoria y caduca sola, así que no afecta a un vencimiento real posterior.
 */
const VENTANA_MS = 10_000;

let marcadoEn: number | null = null;

export function marcarCierreVoluntario(ahora = Date.now()): void {
  marcadoEn = ahora;
}

export function hayCierreVoluntarioReciente(ahora = Date.now()): boolean {
  return marcadoEn !== null && ahora - marcadoEn < VENTANA_MS;
}

export function limpiarCierreVoluntario(): void {
  marcadoEn = null;
}
