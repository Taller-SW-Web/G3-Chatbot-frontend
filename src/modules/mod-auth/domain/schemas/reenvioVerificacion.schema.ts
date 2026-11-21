import { z } from "zod";

export const reenvioVerificacionSchema = z.object({
  correo: z.string().trim().email("Correo inválido").max(254),
});

export type ReenvioVerificacionInput = z.infer<typeof reenvioVerificacionSchema>;
