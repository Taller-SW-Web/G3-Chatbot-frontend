import { z } from "zod";
import { longitudMinimaDe, politicaCumplida, type PoliticaContrasena } from "@/domain/utils/passwordPolicy";

/** Celular aceptado por Seguridad: 9 dígitos con prefijo +51 opcional (SPEC-01 Req. 2). */
export const CELULAR_PERU_REGEX = /^(\+51)?[0-9]{9}$/;

export const CELULAR_PERU_MENSAJE = "Ingresa 9 dígitos, por ejemplo 987654321 o +51987654321";

/**
 * Normaliza el celular al formato `+51987654321` (SPEC-01, escenario celular):
 * acepta `987654321`, `51987654321` o `+51987654321`, con espacios o guiones.
 */
export function normalizarCelular(valor: string): string {
  const digitos = valor.replace(/[\s-]/g, "");
  if (/^\d{9}$/.test(digitos)) return `+51${digitos}`;
  if (/^51\d{9}$/.test(digitos)) return `+${digitos}`;
  return valor.trim();
}

export const POLITICA_INCUMPLIDA_MENSAJE = "La contraseña no cumple la política de seguridad";

/**
 * Registration schema. When the fetched password policy is provided, the password
 * must also satisfy it (SPEC-01 "Contraseña que no cumple la política"); without a
 * policy only the minimum length applies.
 */
export function crearRegistroSchema(politica?: PoliticaContrasena) {
  return z
  .object({
    nombres: z.string().trim().min(1, "Requerido").max(80),
    apellidos: z.string().trim().min(1, "Requerido").max(80),
    correo: z.string().trim().email("Correo inválido").max(254),
    celular: z
      .string()
      .min(1, "Requerido")
      .transform(normalizarCelular)
      .refine((v) => CELULAR_PERU_REGEX.test(v), CELULAR_PERU_MENSAJE),
    contrasena: z
      .string()
      .min(longitudMinimaDe(politica), `Mínimo ${longitudMinimaDe(politica)} caracteres`)
      .max(256)
      .refine((v) => !politica || politicaCumplida(politica, v), POLITICA_INCUMPLIDA_MENSAJE),
    confirmar: z.string(),
    aceptaTerminos: z.literal(true, {
      message: "Debes aceptar los términos y condiciones",
    }),
  })
  .refine((d) => d.contrasena === d.confirmar, {
    message: "No coincide",
    path: ["confirmar"],
  });
}

export const registroSchema = crearRegistroSchema();

export type RegistroInput = z.infer<typeof registroSchema>;
