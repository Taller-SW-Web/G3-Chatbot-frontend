import { z } from "zod";

export const otpCelularSchema = z.object({
  codigo: z.string().regex(/^\d{6}$/, "6 dígitos"),
});

export type OtpCelularInput = z.infer<typeof otpCelularSchema>;
