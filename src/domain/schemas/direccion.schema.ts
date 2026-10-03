import { z } from "zod";

// Documento A14: DNI 8 dígitos, RUC 11, CE/PASAPORTE alfanumérico
const docPorTipo = (tipo: string, num: string) => {
  if (tipo === "DNI") return /^\d{8}$/.test(num);
  if (tipo === "RUC") return /^\d{11}$/.test(num);
  return /^[A-Za-z0-9]{6,20}$/.test(num);
};

export const direccionSchema = z
  .object({
    nombre: z.string().min(3, "Requerido"),
    direccion: z.string().min(5, "Dirección exacta requerida"),
    distrito: z.string().min(1, "Elige distrito"),
    referencia: z.string().optional(),
    docTipo: z.enum(["DNI", "RUC", "CE", "PASAPORTE"]),
    docNum: z.string().min(6, "Documento inválido"),
  })
  .refine((d) => docPorTipo(d.docTipo, d.docNum), {
    message: "Documento inválido para el tipo",
    path: ["docNum"],
  });

export type DireccionInput = z.infer<typeof direccionSchema>;
