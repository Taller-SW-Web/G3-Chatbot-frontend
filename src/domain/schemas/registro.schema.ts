import { z } from "zod";

export const registroSchema = z
  .object({
    nombre: z.string().min(3, "Nombre muy corto").max(80),
    correo: z.string().email("Correo inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, {
    message: "No coincide",
    path: ["confirmar"],
  });

export type RegistroInput = z.infer<typeof registroSchema>;
