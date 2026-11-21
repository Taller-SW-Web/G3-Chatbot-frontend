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

// Las reglas evaluables y su caché viven en `mod-auth` (H-05): son negocio de
// autenticación, no kernel. Aquí solo queda el tipo y la normalización común.
