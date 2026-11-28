import { z } from "zod";

/**
 * Motivos reales del contrato de G5 (Ventas F6). Solo existen estos cinco:
 * no hay `OTRO`. El cliente elige el más cercano y explica el caso en
 * `descripcion` (mín. 20 caracteres).
 */
export const RECLAMO_MOTIVO_VALUES = [
  "INCUMPLIMIENTO_PLAZO_ENTREGA",
  "PRODUCTO_DEFECTUOSO_O_INCORRECTO",
  "COBRO_INDEBIDO_O_NO_RECONOCIDO",
  "ATENCION_INADECUADA",
  "INCUMPLIMIENTO_GARANTIA",
] as const;

/** G5 code -> visible label. G5 receives the code, not the label. */
export const RECLAMO_MOTIVOS = [
  { value: "INCUMPLIMIENTO_PLAZO_ENTREGA", label: "Incumplimiento del plazo de entrega" },
  { value: "PRODUCTO_DEFECTUOSO_O_INCORRECTO", label: "Producto defectuoso o incorrecto" },
  { value: "COBRO_INDEBIDO_O_NO_RECONOCIDO", label: "Cobro indebido o no reconocido" },
  { value: "ATENCION_INADECUADA", label: "Atención inadecuada" },
  { value: "INCUMPLIMIENTO_GARANTIA", label: "Incumplimiento de garantía" },
] as const;

export const reclamoSchema = z.object({
  pedidoId: z.string().min(1, "Pedido requerido"),
  // `tipo` llega desde `defaultValues` del formulario (SPEC-19).
  tipo: z.enum(["RECLAMO", "QUEJA"]),
  motivo: z.enum(RECLAMO_MOTIVO_VALUES),
  descripcion: z.string().min(20, "Describe lo ocurrido (mín 20 caracteres)").max(1000),
  nombre: z.string().optional(),
  email: z.union([z.string().email("Correo inválido"), z.literal("")]).optional(),
  documento: z.string().min(1, "Documento requerido").max(20),
  telefono: z.string().min(1, "Teléfono requerido").max(20),
  solucion: z.string().max(500).optional(),
});

export type ReclamoInput = z.infer<typeof reclamoSchema>;
