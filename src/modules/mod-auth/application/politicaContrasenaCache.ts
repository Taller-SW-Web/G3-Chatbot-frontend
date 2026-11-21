import type { PoliticaContrasena } from "@/shared/auth/passwordPolicy";

/**
 * La política se cachea durante la sesión del navegador (SPEC-01 Req. 2);
 * el backend también la cachea 10 min. Vive en mod-auth porque es un dato
 * de su contrato, no del kernel.
 */
let cache: PoliticaContrasena | null = null;

export function getPoliticaContrasenaCache(): PoliticaContrasena | null {
  return cache;
}

export function setPoliticaContrasenaCache(politica: PoliticaContrasena): void {
  cache = politica;
}

export function clearPoliticaContrasenaCache(): void {
  cache = null;
}
