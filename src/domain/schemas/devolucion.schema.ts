import { z } from "zod";

const EVIDENCIA_MAX = 5 * 1024 * 1024; // 5MB

export const DEVOLUCION_MOTIVOS = [
  "Talla incorrecta",
  "No era lo que esperaba",
  "Producto defectuoso",
  "Producto equivocado enviado",
  "Ya no lo quiero",
  "Otro",
] as const;

export const devolucionSchema = z.object({
  tipo: z.enum(["CAMBIO", "DEVOLUCION"]),
  linea: z.string().min(1, "Elige la línea"),
  motivo: z.enum(DEVOLUCION_MOTIVOS),
  descripcion: z.string().max(1000).optional(),
  evidenciaTamano: z
    .number()
    .max(EVIDENCIA_MAX, "Evidencia ≤ 5MB")
    .optional(),
});

export type DevolucionInput = z.infer<typeof devolucionSchema>;
