import { z } from "zod";

export const loginSchema = z.object({
  correo: z.string().email("Correo inválido"),
  password: z.string().min(1, "Requerido"),
});

export type LoginInput = z.infer<typeof loginSchema>;
