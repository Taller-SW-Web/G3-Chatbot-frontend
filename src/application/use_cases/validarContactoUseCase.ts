import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

/** OTP celular + CELULAR_NO_VERIFICADO. SPEC-04 */
export async function validarContactoUseCase(
  api: ChatbotApiPort,
  codigo: string
) {
  if (!/^\d{6}$/.test(codigo)) throw new Error("Código 6 dígitos");
  return api.validarContactoCelular(codigo);
}
