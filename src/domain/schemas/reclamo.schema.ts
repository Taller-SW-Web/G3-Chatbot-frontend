import { z } from "zod";

export const RECLAMO_MOTIVOS = [
  "Producto defectuoso",
  "Producto equivocado",
  "Pedido incompleto",
  "Incumplimiento del plazo de entrega",
  "No recibido",
  "Cobro incorrecto",
  "Atención",
  "Otro",
] as const;

export const reclamoSchema = z.object({
  pedidoId: z.string().min(1, "Pedido requerido"),
  tipo: z.enum(["RECLAMO", "QUEJA"]).default("RECLAMO"),
  motivo: z.enum(RECLAMO_MOTIVOS),
  descripcion: z.string().min(20, "Describe lo ocurrido (mín 20 caracteres)").max(1000),
  documento: z.string().optional(),
  solucion: z.string().optional(),
});

export type ReclamoInput = z.infer<typeof reclamoSchema>;
