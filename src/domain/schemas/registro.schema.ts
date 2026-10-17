import { z } from "zod";

/** Celular peruano: +51 seguido de 9 dígitos que empiezan con 9 (SPEC-01 Req. 2). */
export const CELULAR_PERU_REGEX = /^\+519\d{8}$/;

export const CELULAR_PERU_MENSAJE = "Ingresa un celular peruano de 9 dígitos";

/**
 * Normaliza el celular al formato `+51987654321` (SPEC-01, escenario celular):
 * acepta `987654321`, `51987654321` o `+51987654321`, con espacios o guiones.
 */
export function normalizarCelular(valor: string): string {
  const digitos = valor.replace(/[\s-]/g, "");
  if (/^9\d{8}$/.test(digitos)) return `+51${digitos}`;
  if (/^519\d{8}$/.test(digitos)) return `+${digitos}`;
  return valor.trim();
}

export const registroSchema = z
  .object({
    nombres: z.string().trim().min(1, "Requerido").max(80),
    apellidos: z.string().trim().min(1, "Requerido").max(80),
    correo: z.string().trim().email("Correo inválido").max(254),
    celular: z
      .string()
      .min(1, "Requerido")
      .transform(normalizarCelular)
      .refine((v) => CELULAR_PERU_REGEX.test(v), CELULAR_PERU_MENSAJE),
    contrasena: z.string().min(8, "Mínimo 8 caracteres").max(256),
    confirmar: z.string(),
    aceptaTerminos: z.literal(true, {
      errorMap: () => ({ message: "Debes aceptar los términos y condiciones" }),
    }),
  })
  .refine((d) => d.contrasena === d.confirmar, {
    message: "No coincide",
    path: ["confirmar"],
  });

export type RegistroInput = z.infer<typeof registroSchema>;
