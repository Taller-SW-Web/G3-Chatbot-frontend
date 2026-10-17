/** Política de contraseña (SPEC-01 Req. 2). Puro: sin React, sin red, sin storage. */

/** Reglas que devuelve `GET /sesion/politica-contrasena` (respuesta de Seguridad). */
export type PoliticaContrasena = {
  minLength?: number;
  requireUpper?: boolean;
  requireLower?: boolean;
  requireDigit?: boolean;
  requireSymbol?: boolean;
  mensaje?: string;
};

export type ReglaContrasena = {
  clave: string;
  etiqueta: string;
  cumple: boolean;
};

/** Fallback si Seguridad no responde: se mantiene la validación mínima del formulario. */
export const POLITICA_POR_DEFECTO: PoliticaContrasena = { minLength: 8 };

/**
 * Reglas de la política evaluadas contra el valor actual (tiempo real).
 * Solo se listan las reglas que la política activa (`true`/`minLength` definidos).
 */
export function evaluarPolitica(
  politica: PoliticaContrasena,
  valor: string
): ReglaContrasena[] {
  const minimo = politica.minLength ?? 8;
  const reglas: ReglaContrasena[] = [
    { clave: "longitud", etiqueta: `Al menos ${minimo} caracteres`, cumple: valor.length >= minimo },
  ];
  if (politica.requireUpper) {
    reglas.push({ clave: "mayuscula", etiqueta: "Una mayúscula", cumple: /[A-ZÁÉÍÓÚÜÑ]/.test(valor) });
  }
  if (politica.requireLower) {
    reglas.push({ clave: "minuscula", etiqueta: "Una minúscula", cumple: /[a-záéíóúüñ]/.test(valor) });
  }
  if (politica.requireDigit) {
    reglas.push({ clave: "digito", etiqueta: "Un número", cumple: /\d/.test(valor) });
  }
  if (politica.requireSymbol) {
    reglas.push({ clave: "simbolo", etiqueta: "Un símbolo", cumple: /[^A-Za-z0-9]/.test(valor) });
  }
  return reglas;
}

/** true cuando el valor cumple todas las reglas activas de la política. */
export function politicaCumplida(politica: PoliticaContrasena, valor: string): boolean {
  return evaluarPolitica(politica, valor).every((r) => r.cumple);
}

// La política se cachea durante la sesión del navegador (SPEC-01 Req. 2);
// el backend también la cachea 10 min. Vive aquí para poder probarla sin red.
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
