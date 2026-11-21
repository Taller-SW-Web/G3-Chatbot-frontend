import { z } from "zod";

const EVIDENCIA_MAX = 5 * 1024 * 1024; // 5MB

/** G3 code -> visible label. G5 receives the code, not the label. */
export const DEVOLUCION_MOTIVO_VALUES = [
  "TALLA_INCORRECTA",
  "NO_ERA_LO_QUE_ESPERABA",
  "PRODUCTO_DEFECTUOSO",
  "PRODUCTO_EQUIVOCADO_ENVIADO",
  "YA_NO_LO_QUIERO",
  "OTRO",
] as const;

export const DEVOLUCION_MOTIVOS = [
  { value: "TALLA_INCORRECTA", label: "Talla incorrecta" },
  { value: "NO_ERA_LO_QUE_ESPERABA", label: "No era lo que esperaba" },
  { value: "PRODUCTO_DEFECTUOSO", label: "Producto defectuoso" },
  { value: "PRODUCTO_EQUIVOCADO_ENVIADO", label: "Producto equivocado enviado" },
  { value: "YA_NO_LO_QUIERO", label: "Ya no lo quiero" },
  { value: "OTRO", label: "Otro" },
] as const;

export type DevolucionLinea = {
  productoId: string;
  label: string;
};

export const devolucionSchema = z.object({
  tipo: z.enum(["CAMBIO", "DEVOLUCION_DINERO"]),
  linea: z.string().min(1, "Elige la línea"),
  motivo: z.enum(DEVOLUCION_MOTIVO_VALUES),
  descripcion: z.string().max(1000).optional(),
  evidenciaTamano: z
    .number()
    .max(EVIDENCIA_MAX, "Evidencia ≤ 5MB")
    .optional(),
});

export type DevolucionInput = z.infer<typeof devolucionSchema>;
