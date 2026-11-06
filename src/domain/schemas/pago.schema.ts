import { z } from "zod";

/** Algoritmo de Luhn para verificación de tarjetas (SPEC-14 Req. 3). */
export function validarLuhn(val: string): boolean {
  const clean = val.replace(/\D/g, "");
  if (!clean || clean.length < 13 || clean.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/** Comprueba que el mes/año de vencimiento no esté en el pasado. */
export function validarVencimientoFuturo(venc: string): boolean {
  const match = venc.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!match) return false;
  const mes = parseInt(match[1], 10);
  const anio = 2000 + parseInt(match[2], 10);
  const ahora = new Date();
  const anioActual = ahora.getFullYear();
  const mesActual = ahora.getMonth() + 1; // 1..12
  if (anio < anioActual) return false;
  if (anio === anioActual && mes < mesActual) return false;
  return true;
}

/** Detecta la marca de la tarjeta por BIN. */
export function detectarMarcaTarjeta(numero: string): "VISA" | "MASTERCARD" | "AMEX" | null {
  const clean = numero.replace(/\D/g, "");
  if (clean.startsWith("4")) return "VISA";
  if (clean.startsWith("34") || clean.startsWith("37")) return "AMEX";
  const p2 = parseInt(clean.slice(0, 2), 10);
  const p4 = parseInt(clean.slice(0, 4), 10);
  if ((p2 >= 51 && p2 <= 55) || (p4 >= 2221 && p4 <= 2720)) return "MASTERCARD";
  return null;
}

// Solo tarjeta en este canal (SPEC-14). Sin guardar PAN: validación estricta en el cliente.
export const pagoSchema = z
  .object({
    titular: z.string().min(3, "Ingresa el nombre del titular").optional(),
    tarjetaNum: z
      .string()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => /^\d{13,19}$/.test(v), "Tarjeta inválida")
      .refine((v) => validarLuhn(v), "Número de tarjeta inválido"),
    vencimiento: z
      .string()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "MM/AA")
      .refine((v) => validarVencimientoFuturo(v), "La tarjeta está vencida"),
    cvv: z.string().regex(/^\d{3,4}$/, "CVV inválido"),
  })
  .superRefine((data, ctx) => {
    const marca = detectarMarcaTarjeta(data.tarjetaNum);
    const cleanCvv = data.cvv.replace(/\D/g, "");
    if (marca === "AMEX" && cleanCvv.length !== 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cvv"],
        message: "AMEX requiere un CVV de 4 dígitos",
      });
    } else if (marca && marca !== "AMEX" && cleanCvv.length !== 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cvv"],
        message: "El CVV debe tener 3 dígitos",
      });
    }
  });

export type PagoInput = z.infer<typeof pagoSchema>;
