import { z } from "zod";

// Solo tarjeta en este canal. Sin guardar PAN: solo se valida formato.
export const pagoSchema = z.object({
  tarjetaNum: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => /^\d{13,19}$/.test(v), "Tarjeta inválida"),
  vencimiento: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "MM/AA"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV inválido"),
});

export type PagoInput = z.infer<typeof pagoSchema>;
