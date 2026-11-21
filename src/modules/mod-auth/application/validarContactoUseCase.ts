import type { AuthPort } from "@/modules/mod-auth/ports/authPort";

/** OTP celular + CELULAR_NO_VERIFICADO. SPEC-04 */
export async function validarContactoUseCase(
  api: AuthPort,
  codigo: string
) {
  if (!/^\d{6}$/.test(codigo)) throw new Error("Código 6 dígitos");
  return api.validarContactoCelular(codigo);
}
