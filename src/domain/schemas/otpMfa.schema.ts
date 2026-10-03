import { z } from "zod";

export const otpMfaSchema = z.object({
  codigo: z.string().regex(/^\d{6}$/, "6 dígitos"),
});

export type OtpMfaInput = z.infer<typeof otpMfaSchema>;
