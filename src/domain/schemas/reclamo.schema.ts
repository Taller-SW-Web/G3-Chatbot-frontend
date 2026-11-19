import { z } from "zod";

/** G3 code -> visible label. G5 receives the code, not the label. */
export const RECLAMO_MOTIVO_VALUES = [
  "PRODUCTO_DEFECTUOSO",
  "PRODUCTO_EQUIVOCADO",
  "PEDIDO_INCOMPLETO",
  "INCUMPLIMIENTO_PLAZO_ENTREGA",
  "NO_RECIBIDO",
  "COBRO_INCORRECTO",
  "ATENCION",
  "OTRO",
] as const;

export const RECLAMO_MOTIVOS = [
  { value: "PRODUCTO_DEFECTUOSO", label: "Producto defectuoso" },
  { value: "PRODUCTO_EQUIVOCADO", label: "Producto equivocado" },
  { value: "PEDIDO_INCOMPLETO", label: "Pedido incompleto" },
  { value: "INCUMPLIMIENTO_PLAZO_ENTREGA", label: "Incumplimiento del plazo de entrega" },
  { value: "NO_RECIBIDO", label: "No recibido" },
  { value: "COBRO_INCORRECTO", label: "Cobro incorrecto" },
  { value: "ATENCION", label: "Atención" },
  { value: "OTRO", label: "Otro" },
] as const;

export const reclamoSchema = z.object({
  pedidoId: z.string().min(1, "Pedido requerido"),
  // `tipo` llega desde `defaultValues` del formulario (SPEC-19).
  tipo: z.enum(["RECLAMO", "QUEJA"]),
  motivo: z.enum(RECLAMO_MOTIVO_VALUES),
  descripcion: z.string().min(20, "Describe lo ocurrido (mín 20 caracteres)").max(1000),
  documento: z.string().min(1, "Documento requerido").max(20),
  telefono: z.string().min(1, "Teléfono requerido").max(20),
  solucion: z.string().max(500).optional(),
});

export type ReclamoInput = z.infer<typeof reclamoSchema>;
