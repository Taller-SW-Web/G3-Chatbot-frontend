import { normalizarPolitica, type PoliticaContrasena } from "@/shared/auth/passwordPolicy";

/** Regla visible del checklist de contraseña (SPEC-01 Req. 2). */
export type ReglaContrasena = {
  clave: string;
  etiqueta: string;
  cumple: boolean;
};

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
