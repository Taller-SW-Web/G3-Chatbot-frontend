import { z } from "zod";

// Documento A14: DNI 8 dígitos, RUC 11, CE/PASAPORTE alfanumérico
const mensajeDocumento = (tipo: string, num: string) => {
  if (tipo === "DNI") return /^\d{8}$/.test(num) ? null : "El DNI tiene 8 dígitos";
  if (tipo === "RUC") return /^\d{11}$/.test(num) ? null : "El RUC tiene 11 dígitos";
  return /^[A-Za-z0-9]{6,20}$/.test(num) ? null : "El CE o pasaporte tiene de 6 a 20 letras o números";
};

export const direccionSchema = z
  .object({
    nombre: z.string().min(3, "Requerido"),
    direccion: z.string().min(5, "Dirección exacta requerida"),
    distrito: z.string().min(1, "Elige distrito"),
    referencia: z.string().optional(),
    docTipo: z.enum(["DNI", "RUC", "CE", "PASAPORTE"]),
    docNum: z.string(),
  })
  .superRefine((d, ctx) => {
    const message = mensajeDocumento(d.docTipo, d.docNum);
    if (message) ctx.addIssue({ code: "custom", message, path: ["docNum"] });
  });

export type DireccionInput = z.infer<typeof direccionSchema>;
