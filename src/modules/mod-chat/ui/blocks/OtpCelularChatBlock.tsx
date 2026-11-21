"use client";

import { useRouter } from "next/navigation";
import { OtpCelularFlow } from "@/shared/auth/OtpCelularFlow";
import { useChatStore } from "@/shared/auth/chatStore";

/**
 * Bloque `FORMULARIO/OTP_CELULAR` del chat (SPEC-04).
 *
 * Reutiliza el mismo flujo que "Mi cuenta" y checkout. Al verificar, actualiza
 * el perfil local y ejecuta la `accionPendiente` si era iniciar el checkout.
 */
export function OtpCelularChatBlock({ celularEnmascarado }: { celularEnmascarado?: string }) {
  const router = useRouter();
  const cliente = useChatStore((s) => s.cliente);
  const setCliente = useChatStore((s) => s.setCliente);
  const accionPendiente = useChatStore((s) => s.accionPendiente);
  const setAccionPendiente = useChatStore((s) => s.setAccionPendiente);

  return (
    <OtpCelularFlow
      celularEnmascarado={celularEnmascarado}
      onVerificado={() => {
        if (cliente) setCliente({ ...cliente, celularVerificado: true });
        if (accionPendiente === "INICIAR_CHECKOUT") {
          setAccionPendiente(null);
          router.push("/checkout");
        }
      }}
    />
  );
}
