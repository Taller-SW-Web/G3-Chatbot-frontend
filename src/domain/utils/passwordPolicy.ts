/** Política de contraseña (SPEC-01 Req. 2). Puro: sin React, sin red, sin storage. */

/** Reglas que devuelve `GET /sesion/politica-contrasena` (respuesta de Seguridad). */
export type PoliticaContrasena = {
  // Spanish fields (Seguridad contract); the English aliases remain as fallback.
  longitudMinima?: number;
  requiereMayuscula?: boolean;
  requiereMinuscula?: boolean;
  requiereDigito?: boolean;
  requiereCaracterEspecial?: boolean;
  rechazaComunes?: boolean;
  rechazaDatosPersonales?: boolean;
  historial?: number;
  caducidadDiasAdmin?: number;
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

/** Reads the Spanish policy fields, falling back to the English aliases. */
export function normalizarPolitica(politica: PoliticaContrasena): PoliticaContrasena {
  return {
    ...politica,
    longitudMinima: politica.longitudMinima ?? politica.minLength,
    requiereMayuscula: politica.requiereMayuscula ?? politica.requireUpper,
    requiereMinuscula: politica.requiereMinuscula ?? politica.requireLower,
    requiereDigito: politica.requiereDigito ?? politica.requireDigit,
    requiereCaracterEspecial: politica.requiereCaracterEspecial ?? politica.requireSymbol,
  };
}

/** Minimum length of the policy (Spanish field, alias, then the form default). */
export function longitudMinimaDe(politica?: PoliticaContrasena): number {
  return politica?.longitudMinima ?? politica?.minLength ?? 8;
}

/** Human message for a rule violated in `422 POLITICA_INCUMPLIDA` (`regla` + `esperado`). */
export function describirReglaPolitica(regla?: string, esperado?: string | number): string {
  switch (regla) {
    case "LONGITUD_MINIMA":
      return esperado !== undefined && esperado !== ""
        ? `Debe tener al menos ${esperado} caracteres`
        : "No alcanza la longitud mínima";
    case "MAYUSCULA":
      return "Debe incluir una mayúscula";
    case "MINUSCULA":
      return "Debe incluir una minúscula";
    case "DIGITO":
      return "Debe incluir un número";
    case "CARACTER_ESPECIAL":
      return "Debe incluir un símbolo";
    case "CONTRASENA_COMUN":
      return "Es una contraseña demasiado común";
    case "DATOS_PERSONALES":
      return "No debe contener tus datos personales";
    case "YA_UTILIZADA":
      return "Ya usaste esta contraseña antes. Elige una distinta";
    default:
      return "No cumple la política de seguridad";
  }
}

/** Fallback si Seguridad no responde: se mantiene la validación mínima del formulario. */
export const POLITICA_POR_DEFECTO: PoliticaContrasena = { longitudMinima: 8 };

/**
 * Reglas de la política evaluadas contra el valor actual (tiempo real).
 * Solo se listan las reglas que la política activa (`true`/`minLength` definidos).
 */
export function evaluarPolitica(
  politica: PoliticaContrasena,
  valor: string
): ReglaContrasena[] {
  politica = normalizarPolitica(politica);
  const minimo = politica.longitudMinima ?? 8;
  const reglas: ReglaContrasena[] = [
    { clave: "longitud", etiqueta: `Al menos ${minimo} caracteres`, cumple: valor.length >= minimo },
  ];
  if (politica.requiereMayuscula) {
    reglas.push({ clave: "mayuscula", etiqueta: "Una mayúscula", cumple: /[A-ZÁÉÍÓÚÜÑ]/.test(valor) });
  }
  if (politica.requiereMinuscula) {
    reglas.push({ clave: "minuscula", etiqueta: "Una minúscula", cumple: /[a-záéíóúüñ]/.test(valor) });
  }
  if (politica.requiereDigito) {
    reglas.push({ clave: "digito", etiqueta: "Un número", cumple: /\d/.test(valor) });
  }
  if (politica.requiereCaracterEspecial) {
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
